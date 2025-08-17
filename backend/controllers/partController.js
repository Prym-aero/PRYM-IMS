const Part = require('../models/produtPart'); // ✅ Make sure filename is correct
const QR = require('../models/QR');
const { uploadToS3, deleteFromS3 } = require("../config/S3V3");
const { incrementPartsAdded, incrementPartsDispatched } = require('./dailyInventoryController');
const { logActivity } = require('./activityController');


exports.AddPart = async (req, res) => {
    try {
        const {
            part_name,
            part_number,
            part_model,
            part_weight,
            part_serial_prefix,
            part_description,
            part_image,
            category,
            technical_specifications
        } = req.body;


        console.log('Received part data:', req.body);

        if (!part_name || !part_number) {
            return res.status(400).json({ message: "Part info not found" });
        }

        const existedPart = await Part.findOne({ part_name });
        if (existedPart) {
            return res.status(409).json({ message: "Part is already present in the database" });
        }

        const part = new Part({
            part_name,
            part_number,
            part_model: part_model || '',
            part_weight: part_weight || '',
            part_serial_prefix: part_serial_prefix || '',
            part_description: part_description || '',
            part_image: part_image || '',
            category: category || 'mechanical',
            technical_specifications: technical_specifications || [],
            inventory: [],
            lastSerialNumber: 0
        });

        await part.save();

        // Log activity
        await logActivity({
            user: req.user?.id || 'unknown',
            userName: req.user?.name || 'Unknown User',
            action: 'part_created',
            description: `Created new part: ${part_name}`,
            entityType: 'part',
            entityId: part._id.toString(),
            entityName: part_name,
            metadata: {
                part_number,
                category,
                part_model
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.status(201).json({ message: "Added part to the list", part });

    } catch (error) {
        console.error("Error in adding part to the list:", error);

        // Check for validation errors
        if (error.name === 'ValidationError') {
            const validationErrors = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({
                message: "Validation error",
                errors: validationErrors,
                details: error.message
            });
        }

        // Check for duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Part number already exists",
                error: "Duplicate part number"
            });
        }

        res.status(500).json({
            message: "Internal Server Error",
            error: error.message,
            details: error
        });
    }
};

exports.getParts = async (req, res) => {
    try {

        const parts = await Part.find();

        if (!parts) {
            return res.status(404).json({ message: "parts not found or empty" })
        }

        res.status(200).json({ message: "fetching all the problem successfully", parts });

    } catch (err) {
        console.error('Error fetching list of parts:', err);
        res.status(500).json({ message: "internal server error", err });
    }
}


exports.addToInventory = async (req, res) => {
    const { partNumber } = req.params;
    const { id, part_name, date, status, partImage, serialPartNumber, operationType } = req.body;

    console.log("Received data:", req.body);

    try {
        const part = await Part.findOne({ part_number: partNumber });

        if (!part) {
            return res.status(404).json({ message: 'Part not found' });
        }

        // Handle different operation types
        if (operationType === 'store_inward') {
            // Store Inward: Move validated parts to in-stock
            const inventoryItem = part.inventory.find(item => item.id === id);

            if (!inventoryItem) {
                return res.status(404).json({
                    message: 'Inventory item not found',
                    status: 'error',
                    isDuplicate: false
                });
            }

            if (inventoryItem.status !== 'validated') {
                return res.status(400).json({
                    message: 'Item must be validated before store inward',
                    currentStatus: inventoryItem.status,
                    status: 'error',
                    isDuplicate: false
                });
            }

            // Update status from validated to in-stock
            inventoryItem.status = 'in-stock';
            inventoryItem.inwardDate = new Date();

            await part.save();

            // ✅ Increment daily inventory tracking when part is moved to stock
            await incrementPartsAdded(1);

            // Log activity
            await logActivity({
                user: req.user?.id || 'unknown',
                userName: req.user?.name || 'Unknown User',
                action: 'inventory_added',
                description: `Part moved to stock: ${inventoryItem.part_name} (${id})`,
                entityType: 'inventory',
                entityId: id,
                entityName: inventoryItem.part_name,
                metadata: {
                    part_number: partNumber,
                    serial_number: inventoryItem.serialPartNumber,
                    from_status: 'validated',
                    to_status: 'in-stock'
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            return res.json({
                message: 'Part successfully moved to stock',
                part,
                status: 'success',
                isDuplicate: false
            });

        } else if (operationType === 'store_outward') {
            // Store Outward: Dispatch in-stock parts
            const inventoryItem = part.inventory.find(item => item.id === id);

            if (!inventoryItem) {
                return res.status(404).json({
                    message: 'Inventory item not found',
                    status: 'error',
                    isDuplicate: false
                });
            }

            if (inventoryItem.status !== 'in-stock') {
                return res.status(400).json({
                    message: 'Item must be in-stock before dispatch',
                    currentStatus: inventoryItem.status,
                    status: 'error',
                    isDuplicate: false
                });
            }

            // Update status from in-stock to used
            inventoryItem.status = 'used';
            inventoryItem.dispatchDate = new Date();

            await part.save();

            // ✅ Increment daily inventory tracking when part is dispatched
            await incrementPartsDispatched(1);

            // Log activity
            await logActivity({
                user: req.user?.id || 'unknown',
                userName: req.user?.name || 'Unknown User',
                action: 'inventory_dispatched',
                description: `Part dispatched: ${inventoryItem.part_name} (${id})`,
                entityType: 'inventory',
                entityId: id,
                entityName: inventoryItem.part_name,
                metadata: {
                    part_number: partNumber,
                    serial_number: inventoryItem.serialPartNumber,
                    from_status: 'in-stock',
                    to_status: 'used'
                },
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            return res.json({
                message: 'Part successfully dispatched',
                part,
                status: 'success',
                isDuplicate: false
            });
        }

        // Default: QC Validation - Add new parts with validated status
        // ✅ Check if the part with the same `id` already exists in inventory
        const alreadyExists = part.inventory.some((item) => item.id === id);

        if (alreadyExists) {
            return res.status(409).json({
                message: 'This item is already present in the inventory.',
                status: 'duplicate',
                isDuplicate: true
            });
        }

        let qrDoc = await QR.findOne({}); // assuming only one QR document exists

        // Check if QR ID already exists in scanned list
        if (qrDoc && qrDoc.qrId.includes(id)) {
            return res.status(409).json({
                message: 'This QR ID has already been scanned.',
                status: 'duplicate',
                isDuplicate: true
            });
        }

        let serialPartNumberPrefix = part.lastSerialNumber + 1;
        part.lastSerialNumber = serialPartNumberPrefix;

        if (!qrDoc) {
            // create QR document if it doesn't exist
            qrDoc = await QR.create({ qrId: [id] });
            qrDoc.scannedCount = 1; // Initialize scanned count
            await qrDoc.save();
        } else {
            qrDoc.qrId.push(id);
            qrDoc.scannedCount += 1;
            await qrDoc.save();
        }

        // ✅ Add to inventory with default "validated" status for QC validation
        const finalStatus = status || "validated"; // Default to validated for QC validation

        part.inventory.push({
            id,
            part_name,
            part_number: partNumber,
            image: partImage || "",
            serialPartNumber: serialPartNumber + serialPartNumberPrefix,
            date: date || new Date(),
            status: finalStatus,
        });

        await part.save();

        // ✅ QC Validation: Do NOT increment parts added since they're only "validated", not "in-stock"
        // Parts will be counted when they move to "in-stock" via store inward operation

        // Log activity
        await logActivity({
            user: req.user?.id || 'unknown',
            userName: req.user?.name || 'Unknown User',
            action: 'qr_scanned',
            description: `QR code scanned for part: ${part_name} (${id})`,
            entityType: 'qr',
            entityId: id,
            entityName: part_name,
            metadata: {
                part_number: partNumber,
                serial_number: serialPartNumber + serialPartNumberPrefix,
                status
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            message: 'Inventory item added successfully',
            part,
            status: 'success',
            isDuplicate: false
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.dispatchPart = async (req, res) => {
    const { partNumber, id } = req.params;


    try {
        const part = await Part.findOne({ part_number: partNumber });

        if (!part) {

            return res.status(404).json({ message: 'Part not found', status: 'error' });

        }

        // Find the inventory item by `id`
        const inventoryItem = part.inventory.find(item => item.id === id);

        if (!inventoryItem) {
            return res.status(404).json({ message: 'Inventory item not found', status: 'Not Found' });
        }

        if (inventoryItem.status === 'used') {
            return res.status(400).json({ message: 'Item is already dispatched', status: 'dispatched' });
        }

        // Update the status to 'used'
        inventoryItem.status = 'used';

        await part.save();

        // ✅ Increment daily inventory tracking when part is dispatched
        await incrementPartsDispatched(1);

        // Log activity
        await logActivity({
            user: req.user?.id || 'unknown',
            userName: req.user?.name || 'Unknown User',
            action: 'inventory_dispatched',
            description: `Part dispatched: ${inventoryItem.part_name} (${id})`,
            entityType: 'inventory',
            entityId: id,
            entityName: inventoryItem.part_name,
            metadata: {
                part_number: partNumber,
                serial_number: inventoryItem.serialPartNumber
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.json({
            message: 'Inventory item dispatched successfully',
            inventoryItem,
            status: 'Success'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getInventoryPartById = async (req, res) => {
    const { partNumber, id } = req.params;

    try {
        const part = await Part.findOne({ part_number: partNumber });

        if (!part) {
            return res.status(404).json({ message: 'Part not found' });
        }

        // Find the inventory item by `id`
        const inventoryItem = part.inventory.find(item => item.id === id);

        if (!inventoryItem) {
            return res.status(404).json({ message: 'Inventory item not found' });
        }

        if (inventoryItem.status === 'used') {
            return res.status(400).json({ message: 'Item is already dispatched' });
        }

        res.json({ message: 'Inventory item dispatched successfully', part });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
}


exports.getPartById = async (req, res) => {
    const { id } = req.params;

    try {
        const part = await Part.findById(id);

        if (!part) {
            return res.status(404).json({ message: "part not found " });

        }

        res.status(200).json({ message: 'part found successfully', part });

    } catch (err) {
        console.error(err)
        res.status(500).json({ message: "Server Error" });
    }
}



// Get validated parts (pending for store inward)
exports.getValidatedParts = async (req, res) => {
    try {
        const parts = await Part.find({});
        const validatedItems = [];

        parts.forEach(part => {
            const validated = part.inventory.filter(item => item.status === 'validated');
            validated.forEach(item => {
                validatedItems.push({
                    ...item.toObject(),
                    part_id: part._id,
                    part_details: {
                        part_name: part.part_name,
                        part_number: part.part_number,
                        part_description: part.part_description
                    }
                });
            });
        });

        res.status(200).json({
            message: 'Validated parts retrieved successfully',
            validatedParts: validatedItems,
            count: validatedItems.length
        });
    } catch (err) {
        console.error('Error getting validated parts:', err);
        res.status(500).json({ message: 'Server error' });
    }
};



exports.getInventoryStats = async (req, res) => {
    try {
        const parts = await Part.find({});

        let inStockCount = 0;
        let usedCount = 0;

        parts.forEach((part) => {
            part.inventory.forEach((inv) => {
                if (inv.status === "in-stock") inStockCount++;
                else if (inv.status === "used") usedCount++;
            });
        });

        res.json({
            totalInStock: inStockCount,
            totalUsed: usedCount
        });

    } catch (err) {
        res.status(500).json({ error: "Something went wrong" });
    }
};


exports.uploadDispatchPDF = async (req, res) => {
    try {
        const { file } = req;

        if (!file) {
            return res.status(400).json({ message: "No file provided" });
        }

        // Upload to S3
        const fileName = file.originalname || `dispatch-report-${Date.now()}.pdf`;
        const mimeType = file.mimetype || 'application/pdf';

        const dispatchUrl = await uploadToS3(
            file.buffer,
            fileName,
            mimeType,
            'dispatch-reports'
        );

        // Optional: Save to database
        // await Dispatch.create({ allotmentNo: req.body.allotmentNo, pdfUrl: dispatchUrl });

        res.status(200).json({
            message: "PDF uploaded successfully",
            url: dispatchUrl,
            fileName: fileName
        });
    } catch (err) {
        console.error("S3 upload failed:", err);
        res.status(500).json({
            message: "Upload failed",
            error: err.message
        });
    }
};

exports.UploadImage = async (req, res) => {
    try {
        const { file } = req;

        if (!file) {
            return res.status(400).json({ message: "No file provided" });
        }

        // Validate file type
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return res.status(400).json({
                message: "Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed."
            });
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return res.status(400).json({
                message: "File too large. Maximum size is 10MB."
            });
        }

        // Upload to S3
        const fileName = file.originalname || `image-${Date.now()}.jpg`;
        const mimeType = file.mimetype;

        const imageUrl = await uploadToS3(
            file.buffer,
            fileName,
            mimeType,
            'part-images'
        );

        res.status(200).json({
            message: "Image uploaded successfully",
            imageUrl: imageUrl,
            url: imageUrl, // For backward compatibility
            fileName: fileName
        });
    } catch (err) {
        console.error("S3 upload failed:", err);
        res.status(500).json({
            message: "Upload failed",
            error: err.message
        });
    }
}

// Get all scanned QR IDs
exports.getScannedQRIds = async (req, res) => {
    try {
        const qrDoc = await QR.findOne({});

        if (!qrDoc) {
            return res.status(200).json({
                message: "No QR document found",
                scannedQRIds: []
            });
        }

        res.status(200).json({
            message: "Scanned QR IDs retrieved successfully",
            scannedQRIds: qrDoc.qrId || [],
            scannedCount: qrDoc.scannedCount || 0
        });
    } catch (err) {
        console.error("Error getting scanned QR IDs:", err);
        res.status(500).json({ message: "Server error" });
    }
}

// Check if QR ID is already scanned
exports.checkQRIdExists = async (req, res) => {
    try {
        const { qrId } = req.params;

        if (!qrId) {
            return res.status(400).json({ message: "QR ID is required" });
        }

        const qrDoc = await QR.findOne({});

        if (!qrDoc) {
            return res.status(200).json({
                exists: false,
                message: "QR ID not found"
            });
        }

        const exists = qrDoc.qrId.includes(qrId);

        res.status(200).json({
            exists,
            message: exists ? "QR ID already scanned" : "QR ID not found"
        });
    } catch (err) {
        console.error("Error checking QR ID:", err);
        res.status(500).json({ message: "Server error" });
    }
}

// Update part information
exports.updatePart = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            part_name,
            part_number,
            part_description,
            material,
            weight,
            cadModel,
            manufacturer,
            grade,
            dimensions,
            images
        } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Part ID is required" });
        }

        const part = await Part.findById(id);

        if (!part) {
            return res.status(404).json({ message: "Part not found" });
        }

        // Check if user has permission to edit (24-hour rule)
        if (req.user && req.user.role !== 'admin') {
            const createdAt = part.createdAt || part.date;
            const now = new Date();
            const hoursSinceCreation = (now - new Date(createdAt)) / (1000 * 60 * 60);

            if (hoursSinceCreation > 24) {
                return res.status(403).json({
                    message: "Edit not allowed. Parts can only be edited within 24 hours of creation. Contact admin for changes.",
                    canEdit: false,
                    hoursSinceCreation: Math.round(hoursSinceCreation)
                });
            }
        }

        // Update part fields
        if (part_name !== undefined) part.part_name = part_name;
        if (part_number !== undefined) part.part_number = part_number;
        if (part_description !== undefined) part.part_description = part_description;
        if (material !== undefined) part.material = material;
        if (weight !== undefined) part.weight = weight;
        if (cadModel !== undefined) part.cadModel = cadModel;
        if (manufacturer !== undefined) part.manufacturer = manufacturer;
        if (grade !== undefined) part.grade = grade;
        if (dimensions !== undefined) part.dimensions = dimensions;
        if (images !== undefined) part.images = images;

        await part.save();

        // Log activity
        await logActivity({
            user: req.user?.id || 'unknown',
            userName: req.user?.name || 'Unknown User',
            action: 'part_updated',
            description: `Updated part: ${part.part_name}`,
            entityType: 'part',
            entityId: part._id.toString(),
            entityName: part.part_name,
            metadata: {
                part_number: part.part_number,
                updatedFields: Object.keys(req.body)
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.status(200).json({
            message: "Part updated successfully",
            part
        });
    } catch (err) {
        console.error("Error updating part:", err);
        res.status(500).json({ message: "Server error" });
    }
}

// Check if user can edit part
exports.checkPartEditPermission = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Part ID is required" });
        }

        const part = await Part.findById(id);

        if (!part) {
            return res.status(404).json({ message: "Part not found" });
        }

        let canEdit = true;
        let message = "Edit allowed";
        let hoursSinceCreation = 0;

        // Check if user has permission to edit (24-hour rule)
        if (req.user && req.user.role !== 'admin') {
            const createdAt = part.createdAt || part.date;
            const now = new Date();
            hoursSinceCreation = (now - new Date(createdAt)) / (1000 * 60 * 60);

            if (hoursSinceCreation > 24) {
                canEdit = false;
                message = "Edit not allowed. Parts can only be edited within 24 hours of creation. Contact admin for changes.";
            }
        }

        res.status(200).json({
            canEdit,
            message,
            hoursSinceCreation: Math.round(hoursSinceCreation),
            isAdmin: req.user?.role === 'admin'
        });

    } catch (err) {
        console.error("Error checking edit permission:", err);
        res.status(500).json({ message: "Internal server error", err });
    }
}

// Bulk remove QR IDs from tracking (for dispatch completion)
exports.bulkRemoveQRIds = async (req, res) => {
    try {
        const { qrIds } = req.body;

        if (!qrIds || !Array.isArray(qrIds) || qrIds.length === 0) {
            return res.status(400).json({ message: "QR IDs array is required" });
        }

        const qrDoc = await QR.findOne({});

        if (!qrDoc) {
            return res.status(404).json({ message: "QR document not found" });
        }

        // // Filter out the QR IDs that are being dispatched
        // const originalCount = qrDoc.qrId.length;
        // qrDoc.qrId = qrDoc.qrId.filter(qrId => !qrIds.includes(qrId));
        // const removedCount = originalCount - qrDoc.qrId.length;

        // // Update scanned count
        // qrDoc.scannedCount = Math.max(0, qrDoc.scannedCount - removedCount);

        // await qrDoc.save();

        res.status(200).json({
            message: `${removedCount} QR IDs removed from tracking successfully`,
            removedCount,
            remainingQRIds: qrDoc.qrId.length
        });
    } catch (err) {
        console.error("Error removing QR IDs:", err);
        res.status(500).json({ message: "Server error" });
    }
}








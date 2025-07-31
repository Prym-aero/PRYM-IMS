const Part = require('../models/produtPart'); // ✅ Make sure filename is correct
const QR = require('../models/QR');
const cloudinary = require("../config/Cloudinary");
const streamifier = require("streamifier");


exports.AddPart = async (req, res) => {
    try {
        const { part_name, part_number } = req.body;

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
        });

        await part.save();

        res.status(201).json({ message: "Added part to the list", part });

    } catch (error) {
        console.error("Error in adding part to the list:", error);
        res.status(500).json({ message: "Internal Server Error", error });
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
        console.log('the error in fetching list of parts', err)
        res.status(500).json({ message: "internal server error", err });
    }
}


exports.addToInventory = async (req, res) => {
    const { partNumber } = req.params;
    const { id, part_name, date, status, partImage, serialPartNumber } = req.body;

    try {
        const part = await Part.findOne({ part_number: partNumber });

        if (!part) {
            return res.status(404).json({ message: 'Part not found' });
        }

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
            console.log("Created new QR document.");
        } else {
            qrDoc.qrId.push(id);
            qrDoc.scannedCount += 1;
            await qrDoc.save();
        }

        // ✅ Add to inventory if not exists
        part.inventory.push({
            id,
            part_name,
            part_number: partNumber,
            partImage: partImage || "",
            serialPartNumber: serialPartNumber + serialPartNumberPrefix,
            date: date || new Date(),
            status,
        });

        await part.save();

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

        // Update the status to 'used'
        inventoryItem.status = 'used';

        await part.save();

        res.json({ message: 'Inventory item dispatched successfully', inventoryItem });
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

        // Upload buffer to Cloudinary using a stream
        const streamUpload = (buffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { resource_type: "raw", folder: "dispatch-reports" },
                    (error, result) => {
                        if (result) resolve(result);
                        else reject(error);
                    }
                );
                streamifier.createReadStream(buffer).pipe(stream);
            });
        };

        const result = await streamUpload(file.buffer);

        const dispatchUrl = result.secure_url;

        // Optional: Save to database
        // await Dispatch.create({ allotmentNo: req.body.allotmentNo, pdfUrl: dispatchUrl });

        res.status(200).json({ message: "PDF uploaded", url: dispatchUrl });
    } catch (err) {
        console.error("Cloudinary upload failed:", err);
        res.status(500).json({ message: "Upload failed" });
    }
};

exports.UploadImage = async (req, res) => {
    try {
        const { file } = req;

        if (!file) {
            return res.status(400).json({ message: "No file provided" });
        }

        // Upload buffer to Cloudinary using a stream
        const streamUpload = (buffer) => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { resource_type: "image", folder: "part-images" },
                    (error, result) => {
                        if (result) resolve(result);
                        else reject(error);
                    }
                );
                streamifier.createReadStream(buffer).pipe(stream);
            });
        };

        const result = await streamUpload(file.buffer);

        res.status(200).json({ message: "Image uploaded", imageUrl: result.secure_url });
    } catch (err) {
        console.error("Cloudinary upload failed:", err);
        res.status(500).json({ message: "Upload failed" });
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

        res.status(200).json({
            message: "Part updated successfully",
            part
        });
    } catch (err) {
        console.error("Error updating part:", err);
        res.status(500).json({ message: "Server error" });
    }
}








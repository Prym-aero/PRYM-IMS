const Part = require('../models/produtPart');
const { logActivity } = require('./activityController');

/**
 * Get all parts filtered by part_use (Arjuna, Arjuna Advance, Common)
 * GET /api/dms/parts
 * Query params: part_use (optional), status (optional), category (optional)
 */
exports.getAllPartsForDMS = async (req, res) => {
    try {
        const { part_use, status, category, page = 1, limit = 100 } = req.query;

        // Build filter object
        const filter = {};

        // Filter by part_use if provided
        if (part_use) {
            const validPartUses = ['Arjuna', 'Arjuna Advance', 'Common'];
            if (!validPartUses.includes(part_use)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid part_use. Must be one of: Arjuna, Arjuna Advance, Common'
                });
            }
            filter.part_use = part_use;
        }

        // Filter by category if provided
        if (category) {
            const validCategories = ['mechanical', 'electrical', 'general'];
            if (!validCategories.includes(category)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid category. Must be one of: mechanical, electrical, general'
                });
            }
            filter.category = category;
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get parts with optional status filtering in inventory
        let parts = await Part.find(filter)
            .select('part_name part_number part_use category part_description part_image inventory part_image images part_model technical_specifications part_serial_prefix -_id')
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ part_name: 1 });

        // Process parts to include inventory status filtering and statistics
        const processedParts = parts.map(part => {
            let filteredInventory = part.inventory;

            // Filter inventory by status if provided
            if (status) {
                const validStatuses = ['validated', 'in-stock', 'used', 'Dispatched'];
                if (!validStatuses.includes(status)) {
                    return null; // Will be filtered out
                }
                filteredInventory = part.inventory.filter(item => item.status === status);
            }

            // Calculate inventory statistics
            const inventoryStats = {
                total: part.inventory.length,
                validated: part.inventory.filter(item => item.status === 'validated').length,
                inStock: part.inventory.filter(item => item.status === 'in-stock').length,
                used: part.inventory.filter(item => item.status === 'used').length,
                dispatched: part.inventory.filter(item => item.status === 'Dispatched').length
            };

            return {
                part_name: part.part_name,
                part_number: part.part_number,
                part_use: part.part_use,
                category: part.category,
                part_description: part.part_description,
                part_image: part.part_image,
                part_serial_prefix: part.part_serial_prefix,
                technical_specifications: part.technical_specifications,  
                lastSerialNumber: part.lastSerialNumber,
                inventory: filteredInventory,
            };
        }).filter(part => part !== null); // Remove null entries from invalid status

        // Get total count for pagination
        const totalParts = await Part.countDocuments(filter);
        const totalPages = Math.ceil(totalParts / parseInt(limit));

        // Summary statistics
        const summary = {
            totalParts: processedParts.length,
            totalAvailableItems: processedParts.reduce((sum, part) => sum + part.availableCount, 0),
            partsByUse: {
                Arjuna: processedParts.filter(p => p.part_use === 'Arjuna').length,
                'Arjuna Advance': processedParts.filter(p => p.part_use === 'Arjuna Advance').length,
                Common: processedParts.filter(p => p.part_use === 'Common').length
            },
            partsByCategory: {
                mechanical: processedParts.filter(p => p.category === 'mechanical').length,
                electrical: processedParts.filter(p => p.category === 'electrical').length,
                general: processedParts.filter(p => p.category === 'general').length
            }
        };

        res.status(200).json({
            success: true,
            message: 'Parts retrieved successfully',
            data: {
                parts: processedParts,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems: totalParts,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: parseInt(page) < totalPages,
                    hasPrevPage: parseInt(page) > 1
                },
                summary,
                filters: {
                    part_use: part_use || 'all',
                    status: status || 'all',
                    category: category || 'all'
                }
            }
        });

    } catch (error) {
        console.error('Error fetching parts for DMS:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Update part status to "used" when drone is completed
 * PUT /api/dms/parts/use
 * Body: { partId, inventoryItemId, droneInfo, notes }
 */
exports.markPartAsUsed = async (req, res) => {
    try {
        const { partId, inventoryItemId, droneInfo, notes } = req.body;

        // Validate required fields
        if (!partId || !inventoryItemId) {
            return res.status(400).json({
                success: false,
                message: 'partId and inventoryItemId are required'
            });
        }

        // Find the part
        const part = await Part.findById(partId);
        if (!part) {
            return res.status(404).json({
                success: false,
                message: 'Part not found'
            });
        }

        // Find the specific inventory item
        const inventoryItem = part.inventory.find(item => item.id === inventoryItemId);
        if (!inventoryItem) {
            return res.status(404).json({
                success: false,
                message: 'Inventory item not found'
            });
        }

        // Check if item is available for use (validated or in-stock)
        if (!['validated', 'in-stock'].includes(inventoryItem.status)) {
            return res.status(400).json({
                success: false,
                message: `Cannot mark item as used. Current status: ${inventoryItem.status}. Item must be 'validated' or 'in-stock'.`
            });
        }

        // Update the inventory item status
        const previousStatus = inventoryItem.status;
        inventoryItem.status = 'used';
        inventoryItem.usedDate = new Date();

        // Add drone information if provided
        if (droneInfo) {
            inventoryItem.droneInfo = {
                droneId: droneInfo.droneId || '',
                droneModel: droneInfo.droneModel || '',
                completionDate: new Date(),
                notes: notes || ''
            };
        }

        // Save the updated part
        await part.save();

        // Log the activity
        await logActivity({
            user: 'dms-system',
            userName: 'DMS System',
            action: 'part_marked_used',
            description: `Marked part ${part.part_name} (${inventoryItem.serialPartNumber}) as used`,
            entityType: 'part',
            entityId: part._id.toString(),
            entityName: part.part_name,
            metadata: {
                partId,
                inventoryItemId,
                previousStatus,
                newStatus: 'used',
                part_number: part.part_number,
                part_use: part.part_use,
                serialPartNumber: inventoryItem.serialPartNumber,
                droneInfo: droneInfo || null,
                notes: notes || ''
            },
            ipAddress: req.ip || 'unknown',
            userAgent: req.get('User-Agent') || 'DMS-API'
        });

        // Return success response with updated item details
        res.status(200).json({
            success: true,
            message: 'Part marked as used successfully',
            data: {
                partId: part._id,
                partName: part.part_name,
                partNumber: part.part_number,
                partUse: part.part_use,
                inventoryItem: {
                    id: inventoryItem.id,
                    serialPartNumber: inventoryItem.serialPartNumber,
                    previousStatus,
                    currentStatus: inventoryItem.status,
                    usedDate: inventoryItem.usedDate,
                    droneInfo: inventoryItem.droneInfo || null
                },
                timestamp: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error marking part as used:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get specific part details by ID
 * GET /api/dms/parts/:partId
 */
exports.getPartById = async (req, res) => {
    try {
        const { partId } = req.params;

        const part = await Part.findById(partId)
            .select('part_name part_number part_use category part_description part_image inventory lastSerialNumber technical_specifications');

        if (!part) {
            return res.status(404).json({
                success: false,
                message: 'Part not found'
            });
        }

        // Calculate detailed inventory statistics
        const inventoryStats = {
            total: part.inventory.length,
            validated: part.inventory.filter(item => item.status === 'validated').length,
            inStock: part.inventory.filter(item => item.status === 'in-stock').length,
            used: part.inventory.filter(item => item.status === 'used').length,
            dispatched: part.inventory.filter(item => item.status === 'Dispatched').length
        };

        // Group inventory by status
        const inventoryByStatus = {
            validated: part.inventory.filter(item => item.status === 'validated'),
            inStock: part.inventory.filter(item => item.status === 'in-stock'),
            used: part.inventory.filter(item => item.status === 'used'),
            dispatched: part.inventory.filter(item => item.status === 'Dispatched')
        };

        res.status(200).json({
            success: true,
            message: 'Part details retrieved successfully',
            data: {
                part: {
                    _id: part._id,
                    part_name: part.part_name,
                    part_number: part.part_number,
                    part_use: part.part_use,
                    category: part.category,
                    part_description: part.part_description,
                    part_image: part.part_image,
                    lastSerialNumber: part.lastSerialNumber,
                    technical_specifications: part.technical_specifications
                },
                inventory: inventoryByStatus,
                statistics: inventoryStats,
                availableCount: inventoryStats.validated + inventoryStats.inStock
            }
        });

    } catch (error) {
        console.error('Error fetching part details:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get DMS usage statistics and dashboard data
 * GET /api/dms/stats
 */
exports.getDMSStats = async (req, res) => {
    try {
        const { timeframe = '30d' } = req.query;

        // Calculate date range based on timeframe
        let startDate = new Date();
        switch (timeframe) {
            case '7d':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(startDate.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(startDate.getDate() - 90);
                break;
            default:
                startDate.setDate(startDate.getDate() - 30);
        }

        // Get all parts
        const allParts = await Part.find({});

        // Calculate overall statistics
        const stats = {
            totalParts: allParts.length,
            partsByUse: {
                Arjuna: allParts.filter(p => p.part_use === 'Arjuna').length,
                'Arjuna Advance': allParts.filter(p => p.part_use === 'Arjuna Advance').length,
                Common: allParts.filter(p => p.part_use === 'Common').length
            },
            partsByCategory: {
                mechanical: allParts.filter(p => p.category === 'mechanical').length,
                electrical: allParts.filter(p => p.category === 'electrical').length,
                general: allParts.filter(p => p.category === 'general').length
            },
            inventoryStats: {
                total: 0,
                validated: 0,
                inStock: 0,
                used: 0,
                dispatched: 0
            },
            recentUsage: {
                last7Days: 0,
                last30Days: 0,
                thisMonth: 0
            }
        };

        // Calculate inventory statistics and recent usage
        const now = new Date();
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        allParts.forEach(part => {
            part.inventory.forEach(item => {
                // Overall inventory stats
                stats.inventoryStats.total++;
                stats.inventoryStats[item.status === 'in-stock' ? 'inStock' : item.status]++;

                // Recent usage stats (for items marked as used)
                if (item.status === 'used' && item.usedDate) {
                    const usedDate = new Date(item.usedDate);
                    if (usedDate >= last7Days) stats.recentUsage.last7Days++;
                    if (usedDate >= last30Days) stats.recentUsage.last30Days++;
                    if (usedDate >= thisMonthStart) stats.recentUsage.thisMonth++;
                }
            });
        });

        // Top used parts (parts with most used inventory items)
        const topUsedParts = allParts
            .map(part => ({
                _id: part._id,
                part_name: part.part_name,
                part_number: part.part_number,
                part_use: part.part_use,
                usedCount: part.inventory.filter(item => item.status === 'used').length,
                totalCount: part.inventory.length
            }))
            .filter(part => part.usedCount > 0)
            .sort((a, b) => b.usedCount - a.usedCount)
            .slice(0, 10);

        // Available parts (parts with validated or in-stock items)
        const availableParts = allParts
            .map(part => ({
                _id: part._id,
                part_name: part.part_name,
                part_number: part.part_number,
                part_use: part.part_use,
                availableCount: part.inventory.filter(item =>
                    ['validated', 'in-stock'].includes(item.status)
                ).length
            }))
            .filter(part => part.availableCount > 0)
            .sort((a, b) => b.availableCount - a.availableCount);

        res.status(200).json({
            success: true,
            message: 'DMS statistics retrieved successfully',
            data: {
                overview: stats,
                topUsedParts,
                availableParts,
                timeframe,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Error fetching DMS stats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};
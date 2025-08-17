const express = require('express');
const { authKey } = require('../middleware/authMiddleware');
const {
    getAllPartsForDMS,
    markPartAsUsed,
    getPartById,
    getDMSStats
} = require('../controllers/DMS.controller');

const router = express.Router();

// Apply API key authentication to all DMS routes
router.use(authKey);

/**
 * @route   GET /api/dms/parts
 * @desc    Get all parts filtered by part_use (Arjuna, Arjuna Advance, Common)
 * @access  Private (API Key required)
 * @params  ?part_use=Arjuna&status=in-stock&category=mechanical&page=1&limit=50
 */
router.get('/dms/parts', getAllPartsForDMS);

/**
 * @route   GET /api/dms/parts/:partId
 * @desc    Get specific part details by ID
 * @access  Private (API Key required)
 */
router.get('/dms/parts/:partId', getPartById);

/**
 * @route   PUT /api/dms/parts/use
 * @desc    Mark part as used when drone is completed
 * @access  Private (API Key required)
 * @body    { partId, inventoryItemId, droneInfo, notes }
 */
router.put('/dms/parts/use', markPartAsUsed);

/**
 * @route   GET /api/dms/stats
 * @desc    Get DMS usage statistics and dashboard data
 * @access  Private (API Key required)
 * @params  ?timeframe=30d
 */
router.get('/dms/stats', getDMSStats);

module.exports = router;
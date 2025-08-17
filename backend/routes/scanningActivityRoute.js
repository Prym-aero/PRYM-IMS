const express = require('express');
const router = express.Router();
const {
  createScanningSession,
  addScannedItem,
  completeSession,
  getScanningSession,
  getAllScanningActivities,
  getRecentActivities,
  cancelSession,
  getScanningStatistics
} = require('../controllers/scanningActivityController');
const {authMiddleware} = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Create new scanning session
router.post('/sessions', createScanningSession);

// Get all scanning activities with pagination and filters
router.get('/activities', getAllScanningActivities);

// Get recent scanning activities
router.get('/activities/recent', getRecentActivities);

// Get scanning statistics
router.get('/statistics', getScanningStatistics);

// Get specific scanning session
router.get('/sessions/:sessionId', getScanningSession);

// Add scanned item to session
router.post('/sessions/:sessionId/items', addScannedItem);

// Complete scanning session
router.post('/sessions/:sessionId/complete', completeSession);

// Cancel scanning session
router.post('/sessions/:sessionId/cancel', cancelSession);

module.exports = router;

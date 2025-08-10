const express = require('express');
const router = express.Router();
const {
  getCurrentStock,
  addParts,
  dispatchParts,
  getDailyReport,
  getReportsRange,
  openDailyStock,
  closeDailyStock,
  forceReopenDailyStock
} = require('../controllers/dailyInventoryController');
const authMiddleware = require('../middleware/authMiddleware');

// Get current stock for today
router.get('/current-stock', authMiddleware, getCurrentStock);

// Add parts to inventory
router.post('/add-parts', authMiddleware, addParts);

// Dispatch parts from inventory
router.post('/dispatch-parts', authMiddleware, dispatchParts);

// Get daily report for a specific date
router.get('/report/:date', authMiddleware, getDailyReport);

// Get reports for a date range
router.get('/reports', authMiddleware, getReportsRange);

// Manual triggers for automation (for testing)
router.post('/open-daily-stock', authMiddleware, openDailyStock);
router.post('/close-daily-stock', authMiddleware, closeDailyStock);
router.post('/force-reopen-daily-stock', authMiddleware, forceReopenDailyStock);

module.exports = router;

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
  forceReopenDailyStock,
  autoTriggerDailyStockAutomation
} = require('../controllers/dailyInventoryController');
const {authMiddleware} = require('../middleware/authMiddleware');

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

// Auto-trigger daily stock automation
router.post('/auto-trigger-automation', authMiddleware, async (req, res) => {
  try {
    const result = await autoTriggerDailyStockAutomation();
    res.status(200).json({
      success: true,
      message: 'Daily stock automation triggered successfully',
      data: result
    });
  } catch (error) {
    console.error('Error triggering automation:', error);
    res.status(500).json({
      success: false,
      message: 'Error triggering automation',
      error: error.message
    });
  }
});

module.exports = router;

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

// Get current stock for today
router.get('/current-stock', getCurrentStock);

// Add parts to inventory
router.post('/add-parts', addParts);

// Dispatch parts from inventory
router.post('/dispatch-parts', dispatchParts);

// Get daily report for a specific date
router.get('/report/:date', getDailyReport);

// Get reports for a date range
router.get('/reports', getReportsRange);

// Manual triggers for automation (for testing)
router.post('/open-daily-stock', openDailyStock);
router.post('/close-daily-stock', closeDailyStock);
router.post('/force-reopen-daily-stock', forceReopenDailyStock);

module.exports = router;

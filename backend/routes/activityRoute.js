const express = require('express');
const router = express.Router();
const { getRecentActivities, getAllActivities, getActivityStats } = require('../controllers/activityController');
const {authMiddleware} = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get recent activities for dashboard
router.get('/recent', getRecentActivities);

// Get all activities with pagination and filters
router.get('/', getAllActivities);

// Get activity statistics
router.get('/stats', getActivityStats);

module.exports = router;

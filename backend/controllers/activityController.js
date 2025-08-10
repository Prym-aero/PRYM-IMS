const Activity = require('../models/ActivityModel');

// Helper function to log activity
const logActivity = async (activityData) => {
    try {
        const activity = new Activity(activityData);
        await activity.save();
        return activity;
    } catch (error) {
        console.error('Error logging activity:', error);
        return null;
    }
};

// Get recent activities for dashboard
exports.getRecentActivities = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        const activities = await Activity.find()
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();

        res.status(200).json({
            success: true,
            activities
        });
    } catch (error) {
        console.error('Error fetching recent activities:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recent activities',
            error: error.message
        });
    }
};

// Get all activities with pagination and filters
exports.getAllActivities = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        // Build filter object
        const filter = {};
        
        if (req.query.action) {
            filter.action = req.query.action;
        }
        
        if (req.query.entityType) {
            filter.entityType = req.query.entityType;
        }
        
        if (req.query.user) {
            filter.user = req.query.user;
        }
        
        if (req.query.dateFrom || req.query.dateTo) {
            filter.createdAt = {};
            if (req.query.dateFrom) {
                filter.createdAt.$gte = new Date(req.query.dateFrom);
            }
            if (req.query.dateTo) {
                filter.createdAt.$lte = new Date(req.query.dateTo);
            }
        }

        const activities = await Activity.find(filter)
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const totalActivities = await Activity.countDocuments(filter);
        const totalPages = Math.ceil(totalActivities / limit);

        res.status(200).json({
            success: true,
            activities,
            pagination: {
                currentPage: page,
                totalPages,
                totalActivities,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activities',
            error: error.message
        });
    }
};

// Get activity statistics
exports.getActivityStats = async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const [todayCount, weekCount, monthCount, totalCount] = await Promise.all([
            Activity.countDocuments({ createdAt: { $gte: startOfDay } }),
            Activity.countDocuments({ createdAt: { $gte: startOfWeek } }),
            Activity.countDocuments({ createdAt: { $gte: startOfMonth } }),
            Activity.countDocuments()
        ]);

        // Get activity breakdown by action
        const actionBreakdown = await Activity.aggregate([
            {
                $group: {
                    _id: '$action',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        res.status(200).json({
            success: true,
            stats: {
                today: todayCount,
                week: weekCount,
                month: monthCount,
                total: totalCount,
                actionBreakdown
            }
        });
    } catch (error) {
        console.error('Error fetching activity stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch activity statistics',
            error: error.message
        });
    }
};

// Export the logActivity helper function
exports.logActivity = logActivity;

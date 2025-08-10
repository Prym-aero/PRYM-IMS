const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true,
        enum: [
            'part_created',
            'part_updated',
            'part_deleted',
            'product_created',
            'product_updated',
            'product_deleted',
            'inventory_added',
            'inventory_dispatched',
            'qr_scanned',
            'user_login',
            'user_logout',
            'image_uploaded',
            'bulk_operation'
        ]
    },
    description: {
        type: String,
        required: true
    },
    entityType: {
        type: String,
        enum: ['part', 'product', 'inventory', 'user', 'qr', 'system'],
        required: true
    },
    entityId: {
        type: String,
        required: false
    },
    entityName: {
        type: String,
        required: false
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ipAddress: {
        type: String,
        required: false
    },
    userAgent: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

// Index for better query performance
activitySchema.index({ createdAt: -1 });
activitySchema.index({ user: 1, createdAt: -1 });
activitySchema.index({ action: 1, createdAt: -1 });
activitySchema.index({ entityType: 1, createdAt: -1 });

module.exports = mongoose.model('Activity', activitySchema);

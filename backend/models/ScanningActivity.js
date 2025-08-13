const mongoose = require('mongoose');

const scanningActivitySchema = new mongoose.Schema({
  // Basic Information
  activityId: {
    type: String,
    required: true,
    unique: true,
    default: () => `SCAN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },
  
  // Operation Details
  operationType: {
    type: String,
    required: true,
    enum: ['qc_validation', 'store_inward', 'store_outward'],
    index: true
  },
  
  // Operator Information
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  operatorName: {
    type: String,
    required: true
  },
  operatorEmail: {
    type: String,
    required: true
  },
  
  // Product/Part Selection
  selectedProduct: {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    productName: String,
    isProductScan: {
      type: Boolean,
      default: false
    }
  },
  
  // DNS/Job Card Information
  dnsJobCard: {
    type: String,
    required: true,
    index: true
  },
  dnsJobCardType: {
    type: String,
    required: true,
    enum: ['dns_serial', 'job_card'],
    default: 'dns_serial'
  },
  
  // Scanning Session Details
  sessionStartTime: {
    type: Date,
    required: true,
    default: Date.now
  },
  sessionEndTime: {
    type: Date
  },
  sessionDuration: {
    type: Number, // in seconds
    default: 0
  },
  
  // Scanned Items
  scannedItems: [{
    qrId: {
      type: String,
      required: true
    },
    partId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Part'
    },
    partName: String,
    partNumber: String,
    serialNumber: String,
    scannedAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['validated', 'in-stock', 'used', 'dispatched'],
      required: true
    },
    previousStatus: String,
    isExpected: {
      type: Boolean,
      default: true // For product scanning, track if this part was expected
    }
  }],
  
  // Expected Items (for product scanning)
  expectedItems: [{
    partName: String,
    partNumber: String,
    quantity: Number,
    scannedCount: {
      type: Number,
      default: 0
    }
  }],
  
  // Session Statistics
  statistics: {
    totalExpected: {
      type: Number,
      default: 0
    },
    totalScanned: {
      type: Number,
      default: 0
    },
    successfulScans: {
      type: Number,
      default: 0
    },
    duplicateScans: {
      type: Number,
      default: 0
    },
    unexpectedScans: {
      type: Number,
      default: 0
    },
    completionPercentage: {
      type: Number,
      default: 0
    }
  },
  
  // Session Status
  sessionStatus: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active',
    index: true
  },
  
  // Additional Information
  notes: {
    type: String,
    maxlength: 1000
  },
  
  // Location/Device Info
  deviceInfo: {
    userAgent: String,
    ipAddress: String,
    location: String
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
scanningActivitySchema.index({ operatorId: 1, createdAt: -1 });
scanningActivitySchema.index({ operationType: 1, sessionStatus: 1 });
scanningActivitySchema.index({ dnsJobCard: 1, createdAt: -1 });
scanningActivitySchema.index({ 'selectedProduct.productId': 1 });
scanningActivitySchema.index({ sessionStatus: 1, createdAt: -1 });

// Virtual for session duration in human readable format
scanningActivitySchema.virtual('sessionDurationFormatted').get(function() {
  if (!this.sessionDuration) return '0 seconds';
  
  const hours = Math.floor(this.sessionDuration / 3600);
  const minutes = Math.floor((this.sessionDuration % 3600) / 60);
  const seconds = this.sessionDuration % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
});

// Virtual for completion status
scanningActivitySchema.virtual('isCompleted').get(function() {
  return this.sessionStatus === 'completed';
});

// Pre-save middleware to update statistics and session duration
scanningActivitySchema.pre('save', function(next) {
  // Update session duration if session is completed
  if (this.sessionEndTime && this.sessionStartTime) {
    this.sessionDuration = Math.floor((this.sessionEndTime - this.sessionStartTime) / 1000);
  }
  
  // Update statistics
  this.statistics.totalScanned = this.scannedItems.length;
  this.statistics.successfulScans = this.scannedItems.filter(item => item.isExpected).length;
  this.statistics.unexpectedScans = this.scannedItems.filter(item => !item.isExpected).length;
  
  // Calculate completion percentage for product scanning
  if (this.selectedProduct.isProductScan && this.statistics.totalExpected > 0) {
    this.statistics.completionPercentage = Math.round(
      (this.statistics.successfulScans / this.statistics.totalExpected) * 100
    );
  }
  
  // Update timestamp
  this.updatedAt = new Date();
  
  next();
});

// Static method to get recent activities
scanningActivitySchema.statics.getRecentActivities = function(limit = 10) {
  return this.find()
    .populate('operatorId', 'name email role')
    .populate('selectedProduct.productId', 'product_name')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get activities by operator
scanningActivitySchema.statics.getActivitiesByOperator = function(operatorId, limit = 50) {
  return this.find({ operatorId })
    .populate('selectedProduct.productId', 'product_name')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Static method to get activities by operation type
scanningActivitySchema.statics.getActivitiesByOperation = function(operationType, limit = 50) {
  return this.find({ operationType })
    .populate('operatorId', 'name email role')
    .populate('selectedProduct.productId', 'product_name')
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Instance method to add scanned item
scanningActivitySchema.methods.addScannedItem = function(itemData) {
  this.scannedItems.push(itemData);
  return this.save();
};

// Instance method to complete session
scanningActivitySchema.methods.completeSession = function(notes = '') {
  this.sessionStatus = 'completed';
  this.sessionEndTime = new Date();
  this.completedAt = new Date();
  if (notes) this.notes = notes;
  return this.save();
};

// Instance method to cancel session
scanningActivitySchema.methods.cancelSession = function(reason = '') {
  this.sessionStatus = 'cancelled';
  this.sessionEndTime = new Date();
  if (reason) this.notes = reason;
  return this.save();
};

module.exports = mongoose.model('ScanningActivity', scanningActivitySchema);

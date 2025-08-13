const mongoose = require('mongoose');

const dnsJobCardSchema = new mongoose.Schema({
  // Identifier
  identifier: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  
  // Type of identifier
  type: {
    type: String,
    required: true,
    enum: ['dns_serial', 'job_card'],
    index: true
  },
  
  // Display name for dropdown
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Description or additional info
  description: {
    type: String,
    maxlength: 500,
    trim: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed'],
    default: 'active',
    index: true
  },
  
  // Associated project or customer
  project: {
    name: String,
    code: String,
    customer: String
  },
  
  // Usage statistics
  usageStats: {
    totalScans: {
      type: Number,
      default: 0
    },
    lastUsed: {
      type: Date
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastUsedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  
  // Metadata
  metadata: {
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    tags: [String],
    externalId: String, // For integration with external systems
    customFields: {
      type: Map,
      of: String
    }
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
  
  // Audit trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for better query performance
dnsJobCardSchema.index({ type: 1, status: 1 });
dnsJobCardSchema.index({ status: 1, createdAt: -1 });
dnsJobCardSchema.index({ 'project.code': 1, status: 1 });

// Virtual for formatted display
dnsJobCardSchema.virtual('formattedDisplay').get(function() {
  const typeLabel = this.type === 'dns_serial' ? 'DNS' : 'Job Card';
  return `${typeLabel}: ${this.displayName}`;
});

// Virtual for usage summary
dnsJobCardSchema.virtual('usageSummary').get(function() {
  const totalScans = this.usageStats.totalScans || 0;
  const lastUsed = this.usageStats.lastUsed;
  
  if (totalScans === 0) {
    return 'Never used';
  }
  
  const lastUsedText = lastUsed ? 
    `Last used: ${lastUsed.toLocaleDateString()}` : 
    'Last used: Unknown';
    
  return `${totalScans} scans, ${lastUsedText}`;
});

// Pre-save middleware
dnsJobCardSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-generate display name if not provided
  if (!this.displayName) {
    this.displayName = this.identifier;
  }
  
  next();
});

// Static method to get active items for dropdown
dnsJobCardSchema.statics.getActiveForDropdown = function(type = null) {
  const query = { status: 'active' };
  if (type) {
    query.type = type;
  }
  
  return this.find(query)
    .select('identifier displayName type project.name metadata.priority')
    .sort({ 
      'metadata.priority': 1, // urgent first
      displayName: 1 
    });
};

// Static method to get by type
dnsJobCardSchema.statics.getByType = function(type, includeInactive = false) {
  const query = { type };
  if (!includeInactive) {
    query.status = 'active';
  }
  
  return this.find(query)
    .populate('createdBy', 'name email')
    .populate('usageStats.lastUsedBy', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to search
dnsJobCardSchema.statics.search = function(searchTerm, type = null) {
  const query = {
    $or: [
      { identifier: { $regex: searchTerm, $options: 'i' } },
      { displayName: { $regex: searchTerm, $options: 'i' } },
      { description: { $regex: searchTerm, $options: 'i' } },
      { 'project.name': { $regex: searchTerm, $options: 'i' } },
      { 'project.customer': { $regex: searchTerm, $options: 'i' } }
    ]
  };
  
  if (type) {
    query.type = type;
  }
  
  return this.find(query)
    .populate('createdBy', 'name email')
    .sort({ 'metadata.priority': 1, createdAt: -1 });
};

// Instance method to increment usage
dnsJobCardSchema.methods.incrementUsage = function(userId) {
  this.usageStats.totalScans += 1;
  this.usageStats.lastUsed = new Date();
  this.usageStats.lastUsedBy = userId;
  this.updatedBy = userId;
  return this.save();
};

// Instance method to update status
dnsJobCardSchema.methods.updateStatus = function(newStatus, userId) {
  this.status = newStatus;
  this.updatedBy = userId;
  return this.save();
};

module.exports = mongoose.model('DnsJobCard', dnsJobCardSchema);

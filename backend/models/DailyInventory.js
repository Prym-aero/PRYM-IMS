const mongoose = require('mongoose');

const dailyInventorySchema = new mongoose.Schema({
  date: {
    type: String, // Format: YYYY-MM-DD
    required: true,
    unique: true,
    index: true
  },
  openingStock: {
    type: Number,
    required: true,
    default: 0
  },
  closingStock: {
    type: Number,
    required: true,
    default: 0
  },
  partsAdded: {
    type: Number,
    required: true,
    default: 0
  },
  partsDispatched: {
    type: Number,
    required: true,
    default: 0
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0
  },
  isOpened: {
    type: Boolean,
    default: false
  },
  isClosed: {
    type: Boolean,
    default: false
  },
  openedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Virtual to calculate current stock
dailyInventorySchema.virtual('calculatedCurrentStock').get(function() {
  return this.openingStock + this.partsAdded - this.partsDispatched;
});

// Method to update current stock
dailyInventorySchema.methods.updateCurrentStock = function() {
  this.currentStock = this.openingStock + this.partsAdded - this.partsDispatched;
  return this.currentStock;
};

// Static method to get today's date in YYYY-MM-DD format
dailyInventorySchema.statics.getTodayDate = function() {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

// Static method to get yesterday's date in YYYY-MM-DD format
dailyInventorySchema.statics.getYesterdayDate = function() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

// Static method to get or create today's inventory record
dailyInventorySchema.statics.getTodayInventory = async function() {
  const todayDate = this.getTodayDate();
  
  let todayInventory = await this.findOne({ date: todayDate });
  
  if (!todayInventory) {
    // Get yesterday's closing stock
    const yesterdayDate = this.getYesterdayDate();
    const yesterdayInventory = await this.findOne({ date: yesterdayDate });
    
    const openingStock = yesterdayInventory ? yesterdayInventory.closingStock : 0;
    
    todayInventory = new this({
      date: todayDate,
      openingStock: openingStock,
      closingStock: openingStock,
      partsAdded: 0,
      partsDispatched: 0,
      currentStock: openingStock
    });
    
    await todayInventory.save();
  }
  
  return todayInventory;
};

module.exports = mongoose.model('DailyInventory', dailyInventorySchema);

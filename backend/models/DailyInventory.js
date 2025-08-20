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

    // Get real stock data from parts
    const Part = require('./produtPart');
    const parts = await Part.find({});
    let realInStock = 0;

    parts.forEach(part => {
      if (part.inventory && part.inventory.length > 0) {
        part.inventory.forEach(item => {
          if (item.status === 'in-stock') {
            realInStock++;
          }
        });
      }
    });

    // Use real stock or yesterday's closing stock
    const openingStock = realInStock > 0 ? realInStock : (yesterdayInventory ? yesterdayInventory.closingStock : 0);

    todayInventory = new this({
      date: todayDate,
      openingStock: openingStock,
      closingStock: openingStock,
      partsAdded: 0,
      partsDispatched: 0,
      currentStock: openingStock,
      isOpened: true, // ✅ Auto-open when creating new record
      openedAt: new Date()
    });

    await todayInventory.save();
    console.log(`✅ Auto-opened daily stock for ${todayDate} with opening stock: ${openingStock}`);
  } else if (!todayInventory.isOpened) {
    // ✅ Auto-open existing record if not already opened
    const Part = require('./produtPart');
    const parts = await Part.find({});
    let realInStock = 0;

    parts.forEach(part => {
      if (part.inventory && part.inventory.length > 0) {
        part.inventory.forEach(item => {
          if (item.status === 'in-stock') {
            realInStock++;
          }
        });
      }
    });

    todayInventory.openingStock = realInStock;
    todayInventory.currentStock = realInStock;
    todayInventory.closingStock = realInStock;
    todayInventory.isOpened = true;
    todayInventory.openedAt = new Date();

    await todayInventory.save();
    console.log(`✅ Auto-opened existing daily stock for ${todayDate} with opening stock: ${realInStock}`);
  }

  // ✅ Auto-close if it's past 8 PM and not already closed
  const now = new Date();
  const currentHour = now.getHours();

  if (currentHour >= 20 && !todayInventory.isClosed) {
    todayInventory.updateCurrentStock();
    todayInventory.closingStock = todayInventory.currentStock;
    todayInventory.isClosed = true;
    todayInventory.closedAt = new Date();

    await todayInventory.save();
    console.log(`✅ Auto-closed daily stock for ${todayDate} at ${now.toLocaleTimeString()} with closing stock: ${todayInventory.closingStock}`);
  }

  return todayInventory;
};

module.exports = mongoose.model('DailyInventory', dailyInventorySchema);

const DailyInventory = require('../models/DailyInventory');
const Part = require('../models/produtPart');

// Helper function to get real stock data from parts
const getRealStockData = async () => {
  try {
    const parts = await Part.find({});

    let totalInStock = 0;
    let totalUsed = 0;

    parts.forEach(part => {
      if (part.inventory && part.inventory.length > 0) {
        part.inventory.forEach(item => {
          if (item.status === 'in-stock') {
            totalInStock++;
          } else if (item.status === 'used' || item.status === 'dispatched') {
            totalUsed++;
          }
        });
      }
    });

    return {
      totalInStock,
      totalUsed,
      totalParts: totalInStock + totalUsed
    };
  } catch (error) {
    console.error('Error getting real stock data:', error);
    return {
      totalInStock: 0,
      totalUsed: 0,
      totalParts: 0
    };
  }
};

// Get current stock for today
exports.getCurrentStock = async (req, res) => {
  try {
    const todayInventory = await DailyInventory.getTodayInventory();
    const realStockData = await getRealStockData();

    res.status(200).json({
      success: true,
      data: {
        date: todayInventory.date,
        currentStock: todayInventory.currentStock,
        openingStock: todayInventory.openingStock,
        partsAdded: todayInventory.partsAdded,
        partsDispatched: todayInventory.partsDispatched,
        isOpened: todayInventory.isOpened,
        isClosed: todayInventory.isClosed,
        // Real stock data from parts
        realStock: {
          totalInStock: realStockData.totalInStock,
          totalUsed: realStockData.totalUsed,
          totalParts: realStockData.totalParts
        }
      }
    });
  } catch (error) {
    console.error('Error getting current stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting current stock',
      error: error.message
    });
  }
};

// Add parts to inventory
exports.addParts = async (req, res) => {
  try {
    const { quantity, description } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number'
      });
    }
    
    const todayInventory = await DailyInventory.getTodayInventory();
    
    // Update parts added and current stock
    todayInventory.partsAdded += parseInt(quantity);
    todayInventory.updateCurrentStock();
    todayInventory.closingStock = todayInventory.currentStock;
    
    await todayInventory.save();
    
    res.status(200).json({
      success: true,
      message: `${quantity} parts added successfully`,
      data: {
        date: todayInventory.date,
        currentStock: todayInventory.currentStock,
        partsAdded: todayInventory.partsAdded,
        partsDispatched: todayInventory.partsDispatched,
        openingStock: todayInventory.openingStock,
        closingStock: todayInventory.closingStock
      }
    });
  } catch (error) {
    console.error('Error adding parts:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding parts',
      error: error.message
    });
  }
};

// Dispatch parts from inventory
exports.dispatchParts = async (req, res) => {
  try {
    const { quantity, description } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a positive number'
      });
    }
    
    const todayInventory = await DailyInventory.getTodayInventory();
    
    // Check if enough stock is available
    const newCurrentStock = todayInventory.currentStock - parseInt(quantity);
    if (newCurrentStock < 0) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Current stock: ${todayInventory.currentStock}, Requested: ${quantity}`
      });
    }
    
    // Update parts dispatched and current stock
    todayInventory.partsDispatched += parseInt(quantity);
    todayInventory.updateCurrentStock();
    todayInventory.closingStock = todayInventory.currentStock;
    
    await todayInventory.save();
    
    res.status(200).json({
      success: true,
      message: `${quantity} parts dispatched successfully`,
      data: {
        date: todayInventory.date,
        currentStock: todayInventory.currentStock,
        partsAdded: todayInventory.partsAdded,
        partsDispatched: todayInventory.partsDispatched,
        openingStock: todayInventory.openingStock,
        closingStock: todayInventory.closingStock
      }
    });
  } catch (error) {
    console.error('Error dispatching parts:', error);
    res.status(500).json({
      success: false,
      message: 'Error dispatching parts',
      error: error.message
    });
  }
};

// Get daily report for a specific date
exports.getDailyReport = async (req, res) => {
  try {
    const { date } = req.params; // Expected format: YYYY-MM-DD
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required (format: YYYY-MM-DD)'
      });
    }
    
    const dailyInventory = await DailyInventory.findOne({ date });
    
    if (!dailyInventory) {
      return res.status(404).json({
        success: false,
        message: `No inventory data found for date: ${date}`
      });
    }
    
    res.status(200).json({
      success: true,
      data: dailyInventory
    });
  } catch (error) {
    console.error('Error getting daily report:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting daily report',
      error: error.message
    });
  }
};

// Get reports for a date range
exports.getReportsRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Both startDate and endDate are required (format: YYYY-MM-DD)'
      });
    }
    
    const reports = await DailyInventory.find({
      date: {
        $gte: startDate,
        $lte: endDate
      }
    }).sort({ date: 1 });
    
    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    console.error('Error getting reports range:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting reports range',
      error: error.message
    });
  }
};

// Manual trigger for opening stock (8 AM automation)
exports.openDailyStock = async (req, res) => {
  try {
    const result = await openDailyStockAutomation();

    res.status(200).json({
      success: true,
      message: 'Daily stock opened successfully',
      data: result
    });
  } catch (error) {
    console.error('Error opening daily stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error opening daily stock',
      error: error.message
    });
  }
};

// Manual trigger for closing stock (8 PM automation)
exports.closeDailyStock = async (req, res) => {
  try {
    const result = await closeDailyStockAutomation();

    res.status(200).json({
      success: true,
      message: 'Daily stock closed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error closing daily stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error closing daily stock',
      error: error.message
    });
  }
};

// Automation function for opening daily stock (called by cron at 8 AM)
const openDailyStockAutomation = async () => {
  try {
    const todayDate = DailyInventory.getTodayDate();
    const yesterdayDate = DailyInventory.getYesterdayDate();

    // Check if today's record already exists and is opened
    let todayInventory = await DailyInventory.findOne({ date: todayDate });

    if (todayInventory && todayInventory.isOpened) {
      console.log(`Daily stock for ${todayDate} is already opened`);
      return {
        message: `Daily stock for ${todayDate} is already opened`,
        data: todayInventory
      };
    }

    // Get real stock data from parts inventory
    const realStockData = await getRealStockData();

    // Use real in-stock count as opening stock, or yesterday's closing stock if available
    const yesterdayInventory = await DailyInventory.findOne({ date: yesterdayDate });
    const openingStock = yesterdayInventory ? yesterdayInventory.closingStock : realStockData.totalInStock;

    if (todayInventory) {
      // Update existing record
      todayInventory.openingStock = openingStock;
      todayInventory.currentStock = openingStock;
      todayInventory.closingStock = openingStock;
      todayInventory.isOpened = true;
      todayInventory.openedAt = new Date();
    } else {
      // Create new record
      todayInventory = new DailyInventory({
        date: todayDate,
        openingStock: openingStock,
        closingStock: openingStock,
        currentStock: openingStock,
        partsAdded: 0,
        partsDispatched: 0,
        isOpened: true,
        openedAt: new Date()
      });
    }

    await todayInventory.save();

    console.log(`Daily stock opened for ${todayDate} with opening stock: ${openingStock}`);

    return {
      message: `Daily stock opened for ${todayDate}`,
      data: todayInventory
    };
  } catch (error) {
    console.error('Error in openDailyStockAutomation:', error);
    throw error;
  }
};

// Automation function for closing daily stock (called by cron at 8 PM)
const closeDailyStockAutomation = async () => {
  try {
    const todayDate = DailyInventory.getTodayDate();

    const todayInventory = await DailyInventory.findOne({ date: todayDate });

    if (!todayInventory) {
      console.log(`No inventory record found for ${todayDate}`);
      return {
        message: `No inventory record found for ${todayDate}`,
        data: null
      };
    }

    if (todayInventory.isClosed) {
      console.log(`Daily stock for ${todayDate} is already closed`);
      return {
        message: `Daily stock for ${todayDate} is already closed`,
        data: todayInventory
      };
    }

    // Update closing stock and mark as closed
    todayInventory.updateCurrentStock();
    todayInventory.closingStock = todayInventory.currentStock;
    todayInventory.isClosed = true;
    todayInventory.closedAt = new Date();

    await todayInventory.save();

    console.log(`Daily stock closed for ${todayDate} with closing stock: ${todayInventory.closingStock}`);

    return {
      message: `Daily stock closed for ${todayDate}`,
      data: todayInventory
    };
  } catch (error) {
    console.error('Error in closeDailyStockAutomation:', error);
    throw error;
  }
};

// Function to increment today's parts added count (called when scanning)
exports.incrementPartsAdded = async (quantity = 1) => {
  try {
    const todayInventory = await DailyInventory.getTodayInventory();

    todayInventory.partsAdded += quantity;
    todayInventory.updateCurrentStock();
    todayInventory.closingStock = todayInventory.currentStock;

    await todayInventory.save();

    console.log(`Daily inventory: Added ${quantity} parts. Total today: ${todayInventory.partsAdded}`);

    return {
      success: true,
      partsAdded: todayInventory.partsAdded,
      currentStock: todayInventory.currentStock
    };
  } catch (error) {
    console.error('Error incrementing parts added:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to increment today's parts dispatched count (called when dispatching)
exports.incrementPartsDispatched = async (quantity = 1) => {
  try {
    const todayInventory = await DailyInventory.getTodayInventory();

    todayInventory.partsDispatched += quantity;
    todayInventory.updateCurrentStock();
    todayInventory.closingStock = todayInventory.currentStock;

    await todayInventory.save();

    console.log(`Daily inventory: Dispatched ${quantity} parts. Total today: ${todayInventory.partsDispatched}`);

    return {
      success: true,
      partsDispatched: todayInventory.partsDispatched,
      currentStock: todayInventory.currentStock
    };
  } catch (error) {
    console.error('Error incrementing parts dispatched:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Force reset and reopen daily stock with real inventory data
exports.forceReopenDailyStock = async (req, res) => {
  try {
    const todayDate = DailyInventory.getTodayDate();

    // Delete today's record to force fresh start
    await DailyInventory.deleteOne({ date: todayDate });

    // Get real stock data
    const realStockData = await getRealStockData();

    // Create new record with real opening stock
    const todayInventory = new DailyInventory({
      date: todayDate,
      openingStock: realStockData.totalInStock,
      closingStock: realStockData.totalInStock,
      currentStock: realStockData.totalInStock,
      partsAdded: 0,
      partsDispatched: 0,
      isOpened: true,
      openedAt: new Date()
    });

    await todayInventory.save();

    console.log(`Daily stock force reopened for ${todayDate} with opening stock: ${realStockData.totalInStock}`);

    res.status(200).json({
      success: true,
      message: `Daily stock force reopened with real inventory data`,
      data: todayInventory
    });
  } catch (error) {
    console.error('Error force reopening daily stock:', error);
    res.status(500).json({
      success: false,
      message: 'Error force reopening daily stock',
      error: error.message
    });
  }
};

// Export automation functions for use in cron jobs
exports.openDailyStockAutomation = openDailyStockAutomation;
exports.closeDailyStockAutomation = closeDailyStockAutomation;

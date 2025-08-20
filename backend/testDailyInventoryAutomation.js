const mongoose = require('mongoose');
const { autoTriggerDailyStockAutomation } = require('./controllers/dailyInventoryController');
const DailyInventory = require('./models/DailyInventory');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log('✅ MongoDB connected for testing daily inventory automation');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
};

const testDailyInventoryAutomation = async () => {
  try {
    console.log('🧪 Testing Daily Inventory Automation...\n');

    // Test 1: Check current daily inventory status
    console.log('📊 Test 1: Checking current daily inventory status');
    const todayInventory = await DailyInventory.getTodayInventory();
    console.log('Current inventory status:', {
      date: todayInventory.date,
      isOpened: todayInventory.isOpened,
      isClosed: todayInventory.isClosed,
      openingStock: todayInventory.openingStock,
      currentStock: todayInventory.currentStock,
      partsAdded: todayInventory.partsAdded,
      partsDispatched: todayInventory.partsDispatched
    });

    // Test 2: Trigger auto-automation
    console.log('\n🔄 Test 2: Triggering auto-automation');
    const automationResult = await autoTriggerDailyStockAutomation();
    console.log('Automation result:', automationResult);

    // Test 3: Check status after automation
    console.log('\n📊 Test 3: Checking status after automation');
    const updatedInventory = await DailyInventory.getTodayInventory();
    console.log('Updated inventory status:', {
      date: updatedInventory.date,
      isOpened: updatedInventory.isOpened,
      isClosed: updatedInventory.isClosed,
      openingStock: updatedInventory.openingStock,
      currentStock: updatedInventory.currentStock,
      partsAdded: updatedInventory.partsAdded,
      partsDispatched: updatedInventory.partsDispatched,
      openedAt: updatedInventory.openedAt,
      closedAt: updatedInventory.closedAt
    });

    console.log('\n✅ Daily inventory automation test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing daily inventory automation:', error);
  }
};

const main = async () => {
  await connectDB();
  await testDailyInventoryAutomation();
  await mongoose.connection.close();
  console.log('🔌 Database connection closed');
  process.exit(0);
};

main();

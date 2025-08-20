const cron = require('node-cron');
const { openDailyStockAutomation, closeDailyStockAutomation } = require('../controllers/dailyInventoryController');

// Initialize cron jobs
const initializeCronJobs = () => {
  console.log('🕐 Initializing daily inventory cron jobs...');

  // Daily opening stock at 8:00 AM (Monday to Sunday)
  // Cron pattern: '0 8 * * *' = At 8:00 AM every day
  cron.schedule('0 8 * * *', async () => {
    console.log('🌅 Running daily opening stock automation at 8:00 AM');
    try {
      const result = await openDailyStockAutomation();
      console.log('✅ Daily opening stock completed:', result.message);
    } catch (error) {
      console.error('❌ Error in daily opening stock automation:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Change this to your timezone
  });

  // ✅ Additional opening stock trigger every 30 minutes from 8 AM to 8 PM for reliability
  cron.schedule('*/30 8-19 * * *', async () => {
    console.log('🔄 Running backup opening stock check every 30 minutes');
    try {
      const result = await openDailyStockAutomation();
      if (result.message.includes('already opened')) {
        console.log('✅ Opening stock already handled');
      } else {
        console.log('✅ Backup opening stock completed:', result.message);
      }
    } catch (error) {
      console.log('ℹ️ Backup opening stock check (expected if already opened):', error.message);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  // Daily closing stock at 8:00 PM (Monday to Sunday)
  // Cron pattern: '0 20 * * *' = At 8:00 PM every day
  cron.schedule('0 20 * * *', async () => {
    console.log('🌙 Running daily closing stock automation at 8:00 PM');
    try {
      const result = await closeDailyStockAutomation();
      console.log('✅ Daily closing stock completed:', result.message);
    } catch (error) {
      console.error('❌ Error in daily closing stock automation:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata" // Change this to your timezone
  });

  // ✅ Additional closing stock trigger every 30 minutes from 8 PM to 11:59 PM for reliability
  cron.schedule('*/30 20-23 * * *', async () => {
    console.log('🔄 Running backup closing stock check every 30 minutes');
    try {
      const result = await closeDailyStockAutomation();
      if (result.message.includes('already closed')) {
        console.log('✅ Closing stock already handled');
      } else {
        console.log('✅ Backup closing stock completed:', result.message);
      }
    } catch (error) {
      console.log('ℹ️ Backup closing stock check (expected if already closed):', error.message);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  // Optional: Run opening stock automation every minute for testing
  // Uncomment the following lines for testing purposes
  /*
  cron.schedule('* * * * *', async () => {
    console.log('🧪 Testing: Running opening stock automation every minute');
    try {
      const result = await openDailyStockAutomation();
      console.log('✅ Test opening stock completed:', result.message);
    } catch (error) {
      console.error('❌ Error in test opening stock automation:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });
  */

  console.log('✅ Daily inventory cron jobs initialized successfully');
  console.log('📅 Opening stock: Every day at 8:00 AM');
  console.log('📅 Closing stock: Every day at 8:00 PM');
};

// Function to manually trigger opening stock (for testing)
const triggerOpeningStock = async () => {
  console.log('🔧 Manually triggering opening stock automation...');
  try {
    const result = await openDailyStockAutomation();
    console.log('✅ Manual opening stock completed:', result.message);
    return result;
  } catch (error) {
    console.error('❌ Error in manual opening stock automation:', error);
    throw error;
  }
};

// Function to manually trigger closing stock (for testing)
const triggerClosingStock = async () => {
  console.log('🔧 Manually triggering closing stock automation...');
  try {
    const result = await closeDailyStockAutomation();
    console.log('✅ Manual closing stock completed:', result.message);
    return result;
  } catch (error) {
    console.error('❌ Error in manual closing stock automation:', error);
    throw error;
  }
};

// Get all scheduled tasks (for monitoring)
const getScheduledTasks = () => {
  const tasks = cron.getTasks();
  console.log(`📊 Currently scheduled tasks: ${tasks.size}`);
  return tasks;
};

// Stop all cron jobs
const stopAllCronJobs = () => {
  console.log('🛑 Stopping all cron jobs...');
  const tasks = cron.getTasks();
  tasks.forEach((task) => {
    task.stop();
  });
  console.log('✅ All cron jobs stopped');
};

// Start all cron jobs
const startAllCronJobs = () => {
  console.log('▶️ Starting all cron jobs...');
  const tasks = cron.getTasks();
  tasks.forEach((task) => {
    task.start();
  });
  console.log('✅ All cron jobs started');
};

module.exports = {
  initializeCronJobs,
  triggerOpeningStock,
  triggerClosingStock,
  getScheduledTasks,
  stopAllCronJobs,
  startAllCronJobs
};

const ScanningActivity = require('../models/ScanningActivity');
const DnsJobCard = require('../models/DnsJobCard');
const Part = require('../models/produtPart');
const Product = require('../models/product');
const User = require('../models/user');

// Create new scanning session
exports.createScanningSession = async (req, res) => {
  try {
    const {
      operationType,
      dnsJobCard,
      dnsJobCardType,
      selectedProduct,
      notes,
      deviceInfo
    } = req.body;

    // Validate required fields
    if (!operationType || !dnsJobCard) {
      return res.status(400).json({
        success: false,
        message: 'Operation type and DNS/Job Card are required'
      });
    }

    // Get operator info from authenticated user
    const operator = await User.findById(req.user.id);
    if (!operator) {
      return res.status(404).json({
        success: false,
        message: 'Operator not found'
      });
    }

    // Prepare session data
    const sessionData = {
      operationType,
      operatorId: operator._id,
      operatorName: operator.name,
      operatorEmail: operator.email,
      dnsJobCard,
      dnsJobCardType: dnsJobCardType || 'dns_serial',
      notes,
      deviceInfo: {
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        ...deviceInfo
      }
    };

    // Handle product selection
    if (selectedProduct && selectedProduct.productId) {
      const product = await Product.findById(selectedProduct.productId);
      if (product) {
        sessionData.selectedProduct = {
          productId: product._id,
          productName: product.product_name,
          isProductScan: true
        };

        // Set expected items for product scanning
        sessionData.expectedItems = product.parts.map(part => ({
          partName: part.part_name,
          partNumber: part.part_number,
          quantity: part.quantity,
          scannedCount: 0
        }));

        sessionData.statistics.totalExpected = product.parts.reduce(
          (total, part) => total + part.quantity, 0
        );
      }
    }

    // Create scanning session
    const scanningSession = new ScanningActivity(sessionData);
    await scanningSession.save();

    // Increment DNS/Job Card usage
    try {
      const dnsJobCardDoc = await DnsJobCard.findOne({ 
        identifier: dnsJobCard,
        type: dnsJobCardType 
      });
      if (dnsJobCardDoc) {
        await dnsJobCardDoc.incrementUsage(operator._id);
      }
    } catch (error) {
      console.warn('Failed to update DNS/Job Card usage:', error);
    }

    res.status(201).json({
      success: true,
      message: 'Scanning session created successfully',
      data: scanningSession
    });

  } catch (error) {
    console.error('Error creating scanning session:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating scanning session',
      error: error.message
    });
  }
};

// Add scanned item to session
exports.addScannedItem = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const {
      qrId,
      partId,
      partName,
      partNumber,
      serialNumber,
      status,
      previousStatus
    } = req.body;

    // Find scanning session
    const session = await ScanningActivity.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Scanning session not found'
      });
    }

    // Check if session is active
    if (session.sessionStatus !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot add items to inactive session'
      });
    }

    // Check for duplicate scans
    const existingItem = session.scannedItems.find(item => item.qrId === qrId);
    if (existingItem) {
      session.statistics.duplicateScans += 1;
      await session.save();
      
      return res.status(400).json({
        success: false,
        message: 'Item already scanned in this session',
        isDuplicate: true,
        data: session
      });
    }

    // Determine if item is expected (for product scanning)
    let isExpected = true;
    if (session.selectedProduct.isProductScan) {
      const expectedItem = session.expectedItems.find(
        item => item.partName === partName || item.partNumber === partNumber
      );
      
      if (expectedItem) {
        expectedItem.scannedCount += 1;
        isExpected = expectedItem.scannedCount <= expectedItem.quantity;
      } else {
        isExpected = false;
      }
    }

    // Add scanned item
    const scannedItem = {
      qrId,
      partId,
      partName,
      partNumber,
      serialNumber,
      status,
      previousStatus,
      isExpected,
      scannedAt: new Date()
    };

    session.scannedItems.push(scannedItem);
    await session.save();

    res.status(200).json({
      success: true,
      message: 'Item added to scanning session',
      data: session,
      scannedItem
    });

  } catch (error) {
    console.error('Error adding scanned item:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding scanned item',
      error: error.message
    });
  }
};

// Complete scanning session
exports.completeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { notes } = req.body;

    const session = await ScanningActivity.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Scanning session not found'
      });
    }

    if (session.sessionStatus !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Session is not active'
      });
    }

    await session.completeSession(notes);

    res.status(200).json({
      success: true,
      message: 'Scanning session completed successfully',
      data: session
    });

  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({
      success: false,
      message: 'Error completing session',
      error: error.message
    });
  }
};

// Get scanning session by ID
exports.getScanningSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await ScanningActivity.findById(sessionId)
      .populate('operatorId', 'name email role')
      .populate('selectedProduct.productId', 'product_name parts');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Scanning session not found'
      });
    }

    res.status(200).json({
      success: true,
      data: session
    });

  } catch (error) {
    console.error('Error fetching scanning session:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching scanning session',
      error: error.message
    });
  }
};

// Get all scanning activities with pagination and filters
exports.getAllScanningActivities = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      operationType,
      operatorId,
      sessionStatus,
      dnsJobCard,
      startDate,
      endDate,
      search
    } = req.query;

    // Build query
    const query = {};
    
    if (operationType) query.operationType = operationType;
    if (operatorId) query.operatorId = operatorId;
    if (sessionStatus) query.sessionStatus = sessionStatus;
    if (dnsJobCard) query.dnsJobCard = { $regex: dnsJobCard, $options: 'i' };
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    if (search) {
      query.$or = [
        { operatorName: { $regex: search, $options: 'i' } },
        { dnsJobCard: { $regex: search, $options: 'i' } },
        { 'selectedProduct.productName': { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [activities, total] = await Promise.all([
      ScanningActivity.find(query)
        .populate('operatorId', 'name email role')
        .populate('selectedProduct.productId', 'product_name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ScanningActivity.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        activities,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit),
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching scanning activities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching scanning activities',
      error: error.message
    });
  }
};

// Get recent scanning activities
exports.getRecentActivities = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const activities = await ScanningActivity.getRecentActivities(parseInt(limit));

    res.status(200).json({
      success: true,
      data: activities
    });

  } catch (error) {
    console.error('Error fetching recent activities:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recent activities',
      error: error.message
    });
  }
};

// Cancel scanning session
exports.cancelSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason } = req.body;

    const session = await ScanningActivity.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Scanning session not found'
      });
    }

    if (session.sessionStatus !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Session is not active'
      });
    }

    await session.cancelSession(reason);

    res.status(200).json({
      success: true,
      message: 'Scanning session cancelled',
      data: session
    });

  } catch (error) {
    console.error('Error cancelling session:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling session',
      error: error.message
    });
  }
};

// Get scanning statistics
exports.getScanningStatistics = async (req, res) => {
  try {
    const { startDate, endDate, operatorId } = req.query;

    const matchQuery = {};
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }
    if (operatorId) matchQuery.operatorId = operatorId;

    const stats = await ScanningActivity.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          completedSessions: {
            $sum: { $cond: [{ $eq: ['$sessionStatus', 'completed'] }, 1, 0] }
          },
          cancelledSessions: {
            $sum: { $cond: [{ $eq: ['$sessionStatus', 'cancelled'] }, 1, 0] }
          },
          activeSessions: {
            $sum: { $cond: [{ $eq: ['$sessionStatus', 'active'] }, 1, 0] }
          },
          totalItemsScanned: { $sum: '$statistics.totalScanned' },
          totalSuccessfulScans: { $sum: '$statistics.successfulScans' },
          totalDuplicateScans: { $sum: '$statistics.duplicateScans' },
          avgSessionDuration: { $avg: '$sessionDuration' },
          avgCompletionPercentage: { $avg: '$statistics.completionPercentage' }
        }
      }
    ]);

    const operationTypeStats = await ScanningActivity.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$operationType',
          count: { $sum: 1 },
          totalScanned: { $sum: '$statistics.totalScanned' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overall: stats[0] || {},
        byOperationType: operationTypeStats
      }
    });

  } catch (error) {
    console.error('Error fetching scanning statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching scanning statistics',
      error: error.message
    });
  }
};

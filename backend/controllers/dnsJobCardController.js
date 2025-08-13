const DnsJobCard = require('../models/DnsJobCard');
const User = require('../models/user');

// Create new DNS/Job Card
exports.createDnsJobCard = async (req, res) => {
  try {
    const {
      identifier,
      type,
      displayName,
      description,
      project,
      metadata
    } = req.body;

    // Validate required fields
    if (!identifier || !type) {
      return res.status(400).json({
        success: false,
        message: 'Identifier and type are required'
      });
    }

    // Check if identifier already exists
    const existingCard = await DnsJobCard.findOne({ identifier, type });
    if (existingCard) {
      return res.status(400).json({
        success: false,
        message: 'DNS/Job Card with this identifier already exists'
      });
    }

    // Create new DNS/Job Card
    const dnsJobCard = new DnsJobCard({
      identifier,
      type,
      displayName: displayName || identifier,
      description,
      project,
      metadata,
      createdBy: req.user.id,
      usageStats: {
        createdBy: req.user.id
      }
    });

    await dnsJobCard.save();

    // Populate creator info
    await dnsJobCard.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'DNS/Job Card created successfully',
      data: dnsJobCard
    });

  } catch (error) {
    console.error('Error creating DNS/Job Card:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating DNS/Job Card',
      error: error.message
    });
  }
};

// Get all DNS/Job Cards with pagination and filters
exports.getAllDnsJobCards = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    if (search) {
      const searchResults = await DnsJobCard.search(search, type);
      return res.status(200).json({
        success: true,
        data: {
          dnsJobCards: searchResults,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalItems: searchResults.length,
            itemsPerPage: searchResults.length
          }
        }
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [dnsJobCards, total] = await Promise.all([
      DnsJobCard.find(query)
        .populate('createdBy', 'name email')
        .populate('usageStats.lastUsedBy', 'name email')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      DnsJobCard.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.status(200).json({
      success: true,
      data: {
        dnsJobCards,
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
    console.error('Error fetching DNS/Job Cards:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching DNS/Job Cards',
      error: error.message
    });
  }
};

// Get DNS/Job Cards for dropdown
exports.getDnsJobCardsForDropdown = async (req, res) => {
  try {
    const { type } = req.query;

    const dnsJobCards = await DnsJobCard.getActiveForDropdown(type);

    // Format for dropdown
    const formattedCards = dnsJobCards.map(card => ({
      value: card.identifier,
      label: card.displayName,
      type: card.type,
      project: card.project?.name,
      priority: card.metadata?.priority
    }));

    res.status(200).json({
      success: true,
      data: formattedCards
    });

  } catch (error) {
    console.error('Error fetching DNS/Job Cards for dropdown:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching DNS/Job Cards for dropdown',
      error: error.message
    });
  }
};

// Get DNS/Job Card by ID
exports.getDnsJobCardById = async (req, res) => {
  try {
    const { id } = req.params;

    const dnsJobCard = await DnsJobCard.findById(id)
      .populate('createdBy', 'name email role')
      .populate('usageStats.lastUsedBy', 'name email role')
      .populate('updatedBy', 'name email role');

    if (!dnsJobCard) {
      return res.status(404).json({
        success: false,
        message: 'DNS/Job Card not found'
      });
    }

    res.status(200).json({
      success: true,
      data: dnsJobCard
    });

  } catch (error) {
    console.error('Error fetching DNS/Job Card:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching DNS/Job Card',
      error: error.message
    });
  }
};

// Update DNS/Job Card
exports.updateDnsJobCard = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      displayName,
      description,
      status,
      project,
      metadata
    } = req.body;

    const dnsJobCard = await DnsJobCard.findById(id);
    if (!dnsJobCard) {
      return res.status(404).json({
        success: false,
        message: 'DNS/Job Card not found'
      });
    }

    // Update fields
    if (displayName !== undefined) dnsJobCard.displayName = displayName;
    if (description !== undefined) dnsJobCard.description = description;
    if (status !== undefined) dnsJobCard.status = status;
    if (project !== undefined) dnsJobCard.project = project;
    if (metadata !== undefined) {
      dnsJobCard.metadata = { ...dnsJobCard.metadata, ...metadata };
    }

    dnsJobCard.updatedBy = req.user.id;
    await dnsJobCard.save();

    // Populate updated document
    await dnsJobCard.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'updatedBy', select: 'name email' },
      { path: 'usageStats.lastUsedBy', select: 'name email' }
    ]);

    res.status(200).json({
      success: true,
      message: 'DNS/Job Card updated successfully',
      data: dnsJobCard
    });

  } catch (error) {
    console.error('Error updating DNS/Job Card:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating DNS/Job Card',
      error: error.message
    });
  }
};

// Delete DNS/Job Card
exports.deleteDnsJobCard = async (req, res) => {
  try {
    const { id } = req.params;

    const dnsJobCard = await DnsJobCard.findById(id);
    if (!dnsJobCard) {
      return res.status(404).json({
        success: false,
        message: 'DNS/Job Card not found'
      });
    }

    // Check if it's being used in any scanning activities
    const ScanningActivity = require('../models/ScanningActivity');
    const usageCount = await ScanningActivity.countDocuments({
      dnsJobCard: dnsJobCard.identifier
    });

    if (usageCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete DNS/Job Card. It has been used in ${usageCount} scanning activities.`,
        usageCount
      });
    }

    await DnsJobCard.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'DNS/Job Card deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting DNS/Job Card:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting DNS/Job Card',
      error: error.message
    });
  }
};

// Get DNS/Job Card usage statistics
exports.getDnsJobCardStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const dnsJobCard = await DnsJobCard.findById(id);
    if (!dnsJobCard) {
      return res.status(404).json({
        success: false,
        message: 'DNS/Job Card not found'
      });
    }

    // Build query for scanning activities
    const query = { dnsJobCard: dnsJobCard.identifier };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const ScanningActivity = require('../models/ScanningActivity');
    
    const [usageStats, recentActivities] = await Promise.all([
      ScanningActivity.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            completedSessions: {
              $sum: { $cond: [{ $eq: ['$sessionStatus', 'completed'] }, 1, 0] }
            },
            totalItemsScanned: { $sum: '$statistics.totalScanned' },
            avgSessionDuration: { $avg: '$sessionDuration' }
          }
        }
      ]),
      ScanningActivity.find(query)
        .populate('operatorId', 'name email')
        .sort({ createdAt: -1 })
        .limit(10)
    ]);

    res.status(200).json({
      success: true,
      data: {
        dnsJobCard,
        statistics: usageStats[0] || {
          totalSessions: 0,
          completedSessions: 0,
          totalItemsScanned: 0,
          avgSessionDuration: 0
        },
        recentActivities
      }
    });

  } catch (error) {
    console.error('Error fetching DNS/Job Card statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching DNS/Job Card statistics',
      error: error.message
    });
  }
};

// Bulk create DNS/Job Cards
exports.bulkCreateDnsJobCards = async (req, res) => {
  try {
    const { cards } = req.body;

    if (!Array.isArray(cards) || cards.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cards array is required and must not be empty'
      });
    }

    const results = {
      created: [],
      errors: [],
      skipped: []
    };

    for (const cardData of cards) {
      try {
        // Check if already exists
        const existing = await DnsJobCard.findOne({
          identifier: cardData.identifier,
          type: cardData.type
        });

        if (existing) {
          results.skipped.push({
            identifier: cardData.identifier,
            reason: 'Already exists'
          });
          continue;
        }

        // Create new card
        const newCard = new DnsJobCard({
          ...cardData,
          createdBy: req.user.id,
          usageStats: {
            createdBy: req.user.id
          }
        });

        await newCard.save();
        results.created.push(newCard);

      } catch (error) {
        results.errors.push({
          identifier: cardData.identifier,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk operation completed. Created: ${results.created.length}, Skipped: ${results.skipped.length}, Errors: ${results.errors.length}`,
      data: results
    });

  } catch (error) {
    console.error('Error in bulk create DNS/Job Cards:', error);
    res.status(500).json({
      success: false,
      message: 'Error in bulk create DNS/Job Cards',
      error: error.message
    });
  }
};

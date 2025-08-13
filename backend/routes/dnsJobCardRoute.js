const express = require('express');
const router = express.Router();
const {
  createDnsJobCard,
  getAllDnsJobCards,
  getDnsJobCardsForDropdown,
  getDnsJobCardById,
  updateDnsJobCard,
  deleteDnsJobCard,
  getDnsJobCardStats,
  bulkCreateDnsJobCards
} = require('../controllers/dnsJobCardController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get DNS/Job Cards for dropdown (most commonly used)
router.get('/dropdown', getDnsJobCardsForDropdown);

// Bulk create DNS/Job Cards
router.post('/bulk', bulkCreateDnsJobCards);

// Get all DNS/Job Cards with pagination and filters
router.get('/', getAllDnsJobCards);

// Create new DNS/Job Card
router.post('/', createDnsJobCard);

// Get DNS/Job Card by ID
router.get('/:id', getDnsJobCardById);

// Update DNS/Job Card
router.put('/:id', updateDnsJobCard);

// Delete DNS/Job Card
router.delete('/:id', deleteDnsJobCard);

// Get DNS/Job Card usage statistics
router.get('/:id/stats', getDnsJobCardStats);

module.exports = router;

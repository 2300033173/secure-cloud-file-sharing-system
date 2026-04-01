const express = require('express');
const router = express.Router();
const { getLogs, getLogStats, getDashboardStats } = require('../controllers/logController');
const { protect } = require('../middleware/auth');

router.get('/dashboard-stats', protect, getDashboardStats);
router.get('/stats', protect, getLogStats);
router.get('/', protect, getLogs);

module.exports = router;

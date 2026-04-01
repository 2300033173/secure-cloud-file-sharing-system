const express = require('express');
const router = express.Router();
const { getAllUsers, updateUserRole, deactivateUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('Admin'), getAllUsers);
router.put('/:id/role', protect, authorize('Admin'), updateUserRole);
router.put('/:id/deactivate', protect, authorize('Admin'), deactivateUser);

module.exports = router;

const express = require('express');
const router = express.Router();
const { register, login, azureLogin, getMe, refreshToken, logout } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { loginValidation, registerValidation, validate } = require('../middleware/validator');

router.post('/register', registerValidation, validate, register);
router.post('/login', loginValidation, validate, login);
router.post('/azure', azureLogin);
router.post('/refresh', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

module.exports = router;

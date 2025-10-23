const express = require('express');
const router = express.Router();
const {
    register,
    login,
    refreshToken,
    logout,
    logoutAll,
    getMe
} = require('../controllers/authController');
const { validateUser } = require('../middleware/validation');
const auth = require('../middleware/auth');

// @route   POST /api/auth/register
// @desc    Register user
router.post('/register', validateUser, register);

// @route   POST /api/auth/login
// @desc    Login user
router.post('/login', login);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
router.post('/refresh', refreshToken);

// @route   POST /api/auth/logout
// @desc    Logout (blacklist token)
router.post('/logout', auth, logout);

// @route   POST /api/auth/logout-all
// @desc    Logout all devices
router.post('/logout-all', auth, logoutAll);

// @route   GET /api/auth/me
// @desc    Get current user
router.get('/me', auth, getMe);

module.exports = router;
const express = require('express');
const router = express.Router();
const {
    updateProfile,
    getStats,
    updatePreferences
} = require('../controllers/userController');
const auth = require('../middleware/auth');

// @route   PUT /api/users/profile
// @desc    Update user profile
router.put('/profile', auth, updateProfile);

// @route   GET /api/users/stats
// @desc    Get user stats
router.get('/stats', auth, getStats);

// @route   PUT /api/users/preferences
// @desc    Update user preferences
router.put('/preferences', auth, updatePreferences);

module.exports = router;
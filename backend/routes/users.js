const express = require('express');
const router = express.Router();
const {
    updateProfile,
    getStats,
    updatePreferences
} = require('../controllers/userController');
const auth = require('../middleware/auth');

// @route   PUT /api/users/profile
router.put('/profile', auth, updateProfile);

// @route   GET /api/users/stats
router.get('/stats', auth, getStats);

// @route   PUT /api/users/preferences
router.put('/preferences', auth, updatePreferences);

module.exports = router;
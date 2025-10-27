const express = require('express');
const router = express.Router();
const {
    updateProfile,
    getStats,
    updatePreferences
} = require('../controllers/userController');
const {
    getWeeklySchedule,
    updateWeeklySchedule,
    getTodayWorkout
} = require('../controllers/scheduleController');
const auth = require('../middleware/auth');

// @route   PUT /api/users/profile
router.put('/profile', auth, updateProfile);

// @route   GET /api/users/stats
router.get('/stats', auth, getStats);

// @route   PUT /api/users/preferences
router.put('/preferences', auth, updatePreferences);

// @route   GET /api/users/weekly-schedule
// @desc    Get user's weekly workout schedule
router.get('/weekly-schedule', auth, getWeeklySchedule);

// @route   PUT /api/users/weekly-schedule
// @desc    Update user's weekly workout schedule
router.put('/weekly-schedule', auth, updateWeeklySchedule);

// @route   GET /api/users/today-workout
// @desc    Get today's scheduled workout
router.get('/today-workout', auth, getTodayWorkout);

module.exports = router;
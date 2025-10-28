const express = require('express');
const router = express.Router();
const multer = require('multer');
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
const {
    changeUsername,
    changePassword,
    uploadAvatar,
    deleteAvatar,
    addWeightEntry,
    getWeightHistory
} = require('../controllers/profileController');
const auth = require('../middleware/auth');

// Configurar multer para upload de archivos
const upload = multer({ dest: 'uploads/temp/' });

// ========== USER PROFILE ==========

// @route   PUT /api/users/profile
router.put('/profile', auth, updateProfile);

// @route   GET /api/users/stats
router.get('/stats', auth, getStats);

// @route   PUT /api/users/preferences
router.put('/preferences', auth, updatePreferences);

// ========== WEEKLY SCHEDULE ==========

// @route   GET /api/users/weekly-schedule
router.get('/weekly-schedule', auth, getWeeklySchedule);

// @route   PUT /api/users/weekly-schedule
router.put('/weekly-schedule', auth, updateWeeklySchedule);

// @route   GET /api/users/today-workout
router.get('/today-workout', auth, getTodayWorkout);

// ========== PROFILE MANAGEMENT ==========

// @route   PUT /api/users/username
// @desc    Change username
router.put('/username', auth, changeUsername);

// @route   PUT /api/users/password
// @desc    Change password (invalidates all tokens)
router.put('/password', auth, changePassword);

// @route   POST /api/users/avatar
// @desc    Upload avatar image
router.post('/avatar', auth, upload.single('avatar'), uploadAvatar);

// @route   DELETE /api/users/avatar
// @desc    Delete avatar (back to initials)
router.delete('/avatar', auth, deleteAvatar);

// ========== WEIGHT TRACKING ==========

// @route   POST /api/users/weight
// @desc    Add weight entry
router.post('/weight', auth, addWeightEntry);

// @route   GET /api/users/weight-history
// @desc    Get weight history
router.get('/weight-history', auth, getWeightHistory);

module.exports = router;
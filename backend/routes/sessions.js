const express = require('express');
const router = express.Router();
const {
    getSessions,
    getSession,
    startSession,
    updateSession,
    completeSession,
    abandonSession
} = require('../controllers/sessionController');
const auth = require('../middleware/auth');

// @route   GET /api/sessions
// @desc    Get user workout sessions
router.get('/', auth, getSessions);

// @route   GET /api/sessions/:id
// @desc    Get single session
router.get('/:id', auth, getSession);

// @route   POST /api/sessions/start
// @desc    Start workout session
router.post('/start', auth, startSession);

// @route   PUT /api/sessions/:id
// @desc    Update session progress
router.put('/:id', auth, updateSession);

// @route   POST /api/sessions/:id/complete
// @desc    Complete workout session
router.post('/:id/complete', auth, completeSession);

// @route   POST /api/sessions/:id/abandon
// @desc    Abandon workout session
router.post('/:id/abandon', auth, abandonSession);

module.exports = router;
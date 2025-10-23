const express = require('express');
const router = express.Router();
const {
    getSessions,
    getSession,
    startSession,
    addSet,
    updateSession,
    pauseSession,
    resumeSession,
    completeSession,
    abandonSession,
    getActiveSession
} = require('../controllers/sessionController');
const auth = require('../middleware/auth');

// @route   GET /api/sessions
// @desc    Get user workout sessions
router.get('/', auth, getSessions);

// @route   GET /api/sessions/active
// @desc    Get active session
router.get('/active', auth, getActiveSession);

// @route   GET /api/sessions/:id
// @desc    Get single session
router.get('/:id', auth, getSession);

// @route   POST /api/sessions/start
// @desc    Start workout session
router.post('/start', auth, startSession);

// @route   POST /api/sessions/:id/add-set
// @desc    Add a set to session
router.post('/:id/add-set', auth, addSet);

// @route   PUT /api/sessions/:id
// @desc    Update session progress (bulk)
router.put('/:id', auth, updateSession);

// @route   POST /api/sessions/:id/pause
// @desc    Pause session
router.post('/:id/pause', auth, pauseSession);

// @route   POST /api/sessions/:id/resume
// @desc    Resume session
router.post('/:id/resume', auth, resumeSession);

// @route   POST /api/sessions/:id/complete
// @desc    Complete workout session
router.post('/:id/complete', auth, completeSession);

// @route   POST /api/sessions/:id/abandon
// @desc    Abandon workout session
router.post('/:id/abandon', auth, abandonSession);

module.exports = router;
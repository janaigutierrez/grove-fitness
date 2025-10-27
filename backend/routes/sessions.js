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
const { validateSessionStart, validateSessionComplete, validateSessionAbandon } = require('../middleware/validation');

// @route   GET /api/sessions
router.get('/', auth, getSessions);

// @route   GET /api/sessions/:id
router.get('/:id', auth, getSession);

// @route   POST /api/sessions/start
router.post('/start', auth, validateSessionStart, startSession);

// @route   PUT /api/sessions/:id
router.put('/:id', auth, updateSession);

// @route   POST /api/sessions/:id/complete
router.post('/:id/complete', auth, validateSessionComplete, completeSession);

// @route   POST /api/sessions/:id/abandon
router.post('/:id/abandon', auth, validateSessionAbandon, abandonSession);

module.exports = router;
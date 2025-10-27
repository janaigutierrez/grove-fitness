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
router.get('/', auth, getSessions);

// @route   GET /api/sessions/:id
router.get('/:id', auth, getSession);

// @route   POST /api/sessions/start
router.post('/start', auth, startSession);

// @route   PUT /api/sessions/:id
router.put('/:id', auth, updateSession);

// @route   POST /api/sessions/:id/complete
router.post('/:id/complete', auth, completeSession);

// @route   POST /api/sessions/:id/abandon
router.post('/:id/abandon', auth, abandonSession);

module.exports = router;
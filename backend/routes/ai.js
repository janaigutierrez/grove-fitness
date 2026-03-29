const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const {
    chat,
    executeAction,
    generateWorkout,
    generateStarterWorkout,
    analyzeProgress,
    askQuestion,
    changePersonality,
    clearHistory
} = require('../controllers/aiController');
const auth = require('../middleware/auth');

// 10 AI calls per minute per user (applied after auth so req.user is available)
const aiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    keyGenerator: (req) => req.user?._id?.toString() || req.ip,
    message: { success: false, message: 'Massa sol·licituds. Espera un moment.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// @route   POST /api/ai/chat
router.post('/chat', auth, aiLimiter, chat);

// @route   POST /api/ai/generate-workout
router.post('/generate-workout', auth, aiLimiter, generateWorkout);

// @route   POST /api/ai/generate-starter-workout
router.post('/generate-starter-workout', auth, aiLimiter, generateStarterWorkout);

// @route   GET /api/ai/analyze-progress
router.get('/analyze-progress', auth, aiLimiter, analyzeProgress);

// @route   POST /api/ai/ask
router.post('/ask', auth, aiLimiter, askQuestion);

// @route   PUT /api/ai/personality
router.put('/personality', auth, changePersonality);

// @route   POST /api/ai/execute-action
router.post('/execute-action', auth, executeAction);

// @route   DELETE /api/ai/history
router.delete('/history', auth, clearHistory);

module.exports = router;
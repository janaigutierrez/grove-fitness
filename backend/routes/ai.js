const express = require('express');
const router = express.Router();
const {
    chat,
    generateWorkout,
    generateStarterWorkout,
    analyzeProgress,
    askQuestion,
    changePersonality,
    clearHistory
} = require('../controllers/aiController');
const auth = require('../middleware/auth');

// @route   POST /api/ai/chat
router.post('/chat', auth, chat);

// @route   POST /api/ai/generate-workout
router.post('/generate-workout', auth, generateWorkout);

// @route   POST /api/ai/generate-starter-workout
router.post('/generate-starter-workout', auth, generateStarterWorkout);

// @route   GET /api/ai/analyze-progress
router.get('/analyze-progress', auth, analyzeProgress);

// @route   POST /api/ai/ask
router.post('/ask', auth, askQuestion);

// @route   PUT /api/ai/personality
router.put('/personality', auth, changePersonality);

// @route   DELETE /api/ai/history
router.delete('/history', auth, clearHistory);

module.exports = router;
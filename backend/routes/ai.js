const express = require('express');
const router = express.Router();
const {
    chat,
    generateWorkout,
    analyzeProgress,
    askQuestion,
    changePersonality,
    clearHistory
} = require('../controllers/aiController');
const auth = require('../middleware/auth');

// @route   POST /api/ai/chat
// @desc    Chat conversacional con IA
router.post('/chat', auth, chat);

// @route   POST /api/ai/generate-workout
// @desc    Generar workout con IA
router.post('/generate-workout', auth, generateWorkout);

// @route   GET /api/ai/analyze-progress
// @desc    Analizar progreso del usuario con IA
router.get('/analyze-progress', auth, analyzeProgress);

// @route   POST /api/ai/ask
// @desc    Hacer pregunta sobre fitness a la IA
router.post('/ask', auth, askQuestion);

// @route   PUT /api/ai/personality
// @desc    Cambiar personalidad del coach
router.put('/personality', auth, changePersonality);

// @route   DELETE /api/ai/history
// @desc    Limpiar historial de conversación
router.delete('/history', auth, clearHistory);

module.exports = router;
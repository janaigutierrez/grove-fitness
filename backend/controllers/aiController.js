const aiService = require('../services/aiService');

const chat = async (req, res, next) => {
    try {
        const { message } = req.body;
        const result = await aiService.chatWithAI(req.user._id, message);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const generateWorkout = async (req, res, next) => {
    try {
        const { prompt, save_to_library = true } = req.body;
        const result = await aiService.generateAIWorkout(req.user._id, prompt, save_to_library);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const analyzeProgress = async (req, res, next) => {
    try {
        const result = await aiService.analyzeUserProgress(req.user._id);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const askQuestion = async (req, res, next) => {
    try {
        const { question } = req.body;
        const result = await aiService.answerFitnessQuestion(req.user._id, question);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const changePersonality = async (req, res, next) => {
    try {
        const { personality } = req.body;
        const result = await aiService.changePersonality(req.user._id, personality);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const clearHistory = async (req, res, next) => {
    try {
        const result = await aiService.clearChatHistory(req.user._id);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    chat,
    generateWorkout,
    analyzeProgress,
    askQuestion,
    changePersonality,
    clearHistory
};
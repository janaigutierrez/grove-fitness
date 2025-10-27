const sessionService = require('../services/sessionService');

const getSessions = async (req, res, next) => {
    try {
        const { completed, limit } = req.query;
        const sessions = await sessionService.getSessions(req.user._id, { completed, limit });
        res.json(sessions);
    } catch (error) {
        next(error);
    }
};

const getSession = async (req, res, next) => {
    try {
        const session = await sessionService.getSessionById(req.params.id, req.user._id);
        res.json(session);
    } catch (error) {
        next(error);
    }
};

const startSession = async (req, res, next) => {
    try {
        const { workout_id } = req.body;
        const session = await sessionService.startSession(req.user._id, workout_id);
        res.json(session);
    } catch (error) {
        next(error);
    }
};

const updateSession = async (req, res, next) => {
    try {
        const { exercises_performed } = req.body;
        const session = await sessionService.updateSession(req.params.id, req.user._id, exercises_performed);
        res.json(session);
    } catch (error) {
        next(error);
    }
};

const completeSession = async (req, res, next) => {
    try {
        const session = await sessionService.completeSession(req.params.id, req.user._id, req.body);
        res.json(session);
    } catch (error) {
        next(error);
    }
};

const abandonSession = async (req, res, next) => {
    try {
        const { abandon_reason } = req.body;
        const session = await sessionService.abandonSession(req.params.id, req.user._id, abandon_reason);
        res.json(session);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSessions,
    getSession,
    startSession,
    updateSession,
    completeSession,
    abandonSession
};
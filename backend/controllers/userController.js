const userService = require('../services/userService');

const updateProfile = async (req, res, next) => {
    try {
        const user = await userService.updateProfile(req.user._id, req.body);
        res.json(user);
    } catch (error) {
        next(error);
    }
};

const getStats = async (req, res, next) => {
    try {
        const stats = await userService.getStats(req.user._id);
        res.json(stats);
    } catch (error) {
        next(error);
    }
};

const updatePreferences = async (req, res, next) => {
    try {
        const user = await userService.updatePreferences(req.user._id, req.body);
        res.json(user);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    updateProfile,
    getStats,
    updatePreferences
};
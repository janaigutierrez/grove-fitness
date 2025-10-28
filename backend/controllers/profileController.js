const profileService = require('../services/profileService');

const changeUsername = async (req, res, next) => {
    try {
        const { username } = req.body;

        if (!username || username.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Username is required'
            });
        }

        const result = await profileService.changeUsername(req.user._id, username);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        if (new_password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters'
            });
        }

        const result = await profileService.changePassword(req.user._id, current_password, new_password);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const uploadAvatar = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const result = await profileService.uploadAvatar(req.user._id, req.file);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const deleteAvatar = async (req, res, next) => {
    try {
        const result = await profileService.deleteAvatar(req.user._id);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const addWeightEntry = async (req, res, next) => {
    try {
        const { weight } = req.body;

        if (!weight || weight < 30 || weight > 300) {
            return res.status(400).json({
                success: false,
                message: 'Invalid weight value (must be between 30-300 kg)'
            });
        }

        const result = await profileService.addWeightEntry(req.user._id, weight);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const getWeightHistory = async (req, res, next) => {
    try {
        const { limit } = req.query;
        const result = await profileService.getWeightHistory(req.user._id, limit ? parseInt(limit) : 30);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    changeUsername,
    changePassword,
    uploadAvatar,
    deleteAvatar,
    addWeightEntry,
    getWeightHistory
};
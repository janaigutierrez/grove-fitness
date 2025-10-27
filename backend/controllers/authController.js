const authService = require('../services/authService');

const register = async (req, res, next) => {
    try {
        console.log('Body rebut:', req.body); // <-- AFEGEIX AIXÒ

        const result = await authService.registerUser(req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await authService.loginUser(email, password);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        const user = await authService.getUserById(req.user.id);
        res.json(user);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    getMe
};
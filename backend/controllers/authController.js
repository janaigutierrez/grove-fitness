const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generar Access Token (corta duración)
const generateAccessToken = (userId) => {
    return jwt.sign(
        { user: { id: userId } },
        process.env.JWT_SECRET,
        { expiresIn: '15m' } // 15 minutos
    );
};

// Generar Refresh Token (larga duración)
const generateRefreshToken = (userId) => {
    return jwt.sign(
        { user: { id: userId }, type: 'refresh' },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: '7d' } // 7 días
    );
};

// Register
const register = async (req, res) => {
    try {
        const { name, email, password, ...userData } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // Create user
        user = new User({
            name,
            email,
            password,
            ...userData,
            refresh_tokens: [],
            blacklisted_tokens: []
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Save refresh token in user
        user.refresh_tokens.push({
            token: refreshToken,
            created_at: new Date(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
            device: req.headers['user-agent'] || 'unknown'
        });
        await user.save();

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                fitness_level: user.fitness_level
            }
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user._id);
        const refreshToken = generateRefreshToken(user._id);

        // Save refresh token
        user.refresh_tokens.push({
            token: refreshToken,
            created_at: new Date(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            device: req.headers['user-agent'] || 'unknown'
        });

        // Limpiar tokens expirados (opcional)
        user.refresh_tokens = user.refresh_tokens.filter(
            rt => rt.expires_at > new Date()
        );

        await user.save();

        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                fitness_level: user.fitness_level
            }
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Refresh Token
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ msg: 'No refresh token provided' });
        }

        // Verify refresh token
        const decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
        );

        if (decoded.type !== 'refresh') {
            return res.status(401).json({ msg: 'Invalid token type' });
        }

        // Check if user exists
        const user = await User.findById(decoded.user.id);
        if (!user) {
            return res.status(401).json({ msg: 'User not found' });
        }

        // Check if refresh token is in user's list
        const tokenExists = user.refresh_tokens.find(
            rt => rt.token === refreshToken && rt.expires_at > new Date()
        );

        if (!tokenExists) {
            return res.status(401).json({ msg: 'Invalid or expired refresh token' });
        }

        // Generate new access token
        const newAccessToken = generateAccessToken(user._id);

        res.json({
            accessToken: newAccessToken
        });
    } catch (error) {
        console.error(error.message);
        res.status(401).json({ msg: 'Invalid refresh token' });
    }
};

// Logout
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const accessToken = req.header('Authorization')?.replace('Bearer ', '');

        const user = await User.findById(req.user._id);

        // Remover refresh token
        if (refreshToken) {
            user.refresh_tokens = user.refresh_tokens.filter(
                rt => rt.token !== refreshToken
            );
        }

        // Añadir access token a blacklist
        if (accessToken) {
            user.blacklisted_tokens.push({
                token: accessToken,
                blacklisted_at: new Date()
            });

            // Limpiar tokens blacklisteados antiguos (más de 1 día)
            user.blacklisted_tokens = user.blacklisted_tokens.filter(
                bt => bt.blacklisted_at > new Date(Date.now() - 24 * 60 * 60 * 1000)
            );
        }

        await user.save();

        res.json({ msg: 'Logged out successfully' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Logout All (todos los dispositivos)
const logoutAll = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        // Blacklistear todos los refresh tokens
        user.refresh_tokens.forEach(rt => {
            user.blacklisted_tokens.push({
                token: rt.token,
                blacklisted_at: new Date()
            });
        });

        // Limpiar todos los refresh tokens
        user.refresh_tokens = [];

        await user.save();

        res.json({ msg: 'Logged out from all devices' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Get Me
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password -blacklisted_tokens');
        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    logoutAll,
    getMe
};
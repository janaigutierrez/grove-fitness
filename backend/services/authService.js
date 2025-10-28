const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ========== GENERAR TOKENS ==========
const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { user: { id: userId } },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }  // 15 minuts
    );

    const refreshToken = jwt.sign(
        { user: { id: userId } },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '30d' }  // 30 dies
    );

    return { accessToken, refreshToken };
};

// ========== REGISTER ==========
const registerUser = async (userData) => {
    const { name, username, email, password, ...rest } = userData;

    // Validacions
    if (!name || !username || !email || !password) {
        const error = new Error('Name, username, email and password are required');
        error.statusCode = 400;
        throw error;
    }

    // Username: només lletres, números, guions i guions baixos
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
        const error = new Error('Username can only contain letters, numbers, hyphens and underscores');
        error.statusCode = 400;
        throw error;
    }

    // Username mínim 3 caràcters
    if (username.length < 3) {
        const error = new Error('Username must be at least 3 characters long');
        error.statusCode = 400;
        throw error;
    }

    // Check if user exists (email o username)
    let user = await User.findOne({
        $or: [
            { email: email.toLowerCase() },
            { username: username.toLowerCase() }
        ]
    });

    if (user) {
        // Determinar què existeix
        if (user.email.toLowerCase() === email.toLowerCase()) {
            const error = new Error('Email already exists');
            error.statusCode = 400;
            throw error;
        }
        if (user.username.toLowerCase() === username.toLowerCase()) {
            const error = new Error('Username already taken');
            error.statusCode = 400;
            throw error;
        }
    }

    // Create user
    user = new User({
        name,
        username: username.toLowerCase(), // Guardar en minúscules per consistència
        email: email.toLowerCase(),
        password,
        ...rest
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token
    user.refresh_tokens.push({
        token: refreshToken,
        created_at: new Date(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dies
        device: 'web'
    });
    await user.save();

    // Return transformed user
    return {
        accessToken,
        refreshToken,
        user: {
            id: user._id.toString(),
            name: user.name,
            username: user.username,
            email: user.email,
            fitness_level: user.fitness_level
        }
    };
};

// ========== LOGIN ==========
const loginUser = async (email, password) => {
    // Check user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
        const error = new Error('Invalid credentials');
        error.statusCode = 400;
        throw error;
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        const error = new Error('Invalid credentials');
        error.statusCode = 400;
        throw error;
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id);

    // Save refresh token
    user.refresh_tokens.push({
        token: refreshToken,
        created_at: new Date(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dies
        device: 'web'
    });
    await user.save();

    // Return transformed user
    return {
        accessToken,
        refreshToken,
        user: {
            id: user._id.toString(),
            name: user.name,
            username: user.username,
            email: user.email,
            fitness_level: user.fitness_level
        }
    };
};

// ========== GET USER BY ID ==========
const getUserById = async (userId) => {
    const user = await User.findById(userId).select('-password');

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    // Return transformed user
    return {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        email: user.email,
        fitness_level: user.fitness_level,
        weight: user.weight,
        height: user.height,
        age: user.age
    };
};

// ========== LOGOUT (BLACKLIST TOKEN) ==========
const blacklistToken = async (userId, token) => {
    const user = await User.findById(userId);

    if (!user) {
        const error = new Error('User not found');
        error.statusCode = 404;
        throw error;
    }

    // Afegir token a la blacklist
    if (!user.blacklisted_tokens) {
        user.blacklisted_tokens = [];
    }

    user.blacklisted_tokens.push({
        token: token,
        blacklisted_at: new Date()
    });

    await user.save();

    return { message: 'Logout successful' };
};

// ========== REFRESH ACCESS TOKEN ==========
const refreshAccessToken = async (refreshToken) => {
    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.user.id);

        if (!user) {
            const error = new Error('User not found');
            error.statusCode = 404;
            throw error;
        }

        // Verificar que el refresh token existeix i no ha expirat
        const validToken = user.refresh_tokens.find(
            rt => rt.token === refreshToken && new Date(rt.expires_at) > new Date()
        );

        if (!validToken) {
            const error = new Error('Invalid or expired refresh token');
            error.statusCode = 401;
            throw error;
        }

        // Generar nou access token
        const newAccessToken = jwt.sign(
            { user: { id: user._id } },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        return {
            accessToken: newAccessToken
        };
    } catch (error) {
        const err = new Error('Invalid refresh token');
        err.statusCode = 401;
        throw err;
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserById,
    blacklistToken,
    refreshAccessToken
};
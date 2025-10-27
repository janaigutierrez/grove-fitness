const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (userId) => {
    return jwt.sign(
        { user: { id: userId } },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

const registerUser = async (userData) => {
    const { name, email, password, ...rest } = userData;

    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
        const error = new Error('User already exists');
        error.statusCode = 400;
        throw error;
    }

    // Create user
    user = new User({
        name,
        email,
        password,
        ...rest
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return transformed user
    return {
        token,
        user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            fitness_level: user.fitness_level
        }
    };
};

const loginUser = async (email, password) => {
    // Check user exists
    const user = await User.findOne({ email });
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

    // Generate token
    const token = generateToken(user._id);

    // Return transformed user
    return {
        token,
        user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            fitness_level: user.fitness_level
        }
    };
};

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
        email: user.email,
        fitness_level: user.fitness_level,
        weight: user.weight,
        height: user.height,
        age: user.age
    };
};

module.exports = {
    registerUser,
    loginUser,
    getUserById
};
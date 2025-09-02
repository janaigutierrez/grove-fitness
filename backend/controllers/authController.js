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
            ...userData
        });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Return token
        const token = generateToken(user._id);

        res.json({
            token,
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

        // Return token
        const token = generateToken(user._id);

        res.json({
            token,
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

// Get Me
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

module.exports = {
    register,
    login,
    getMe
};
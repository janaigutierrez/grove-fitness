const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ msg: 'No token, authorization denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user exists
        const user = await User.findById(decoded.user.id);
        if (!user) {
            return res.status(401).json({ msg: 'Token is not valid' });
        }

        // Check if token is blacklisted
        const isBlacklisted = user.blacklisted_tokens.some(
            bt => bt.token === token
        );

        if (isBlacklisted) {
            return res.status(401).json({ msg: 'Token has been revoked' });
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
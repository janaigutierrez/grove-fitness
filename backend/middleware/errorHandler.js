const errorHandler = (err, req, res, next) => {
    console.error('❌ Error:', err);

    // Error de validació de Mongoose
    if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => e.message);
        return res.status(400).json({
            success: false,
            message: errors.join(', ')
        });
    }

    // Error de cast (ID invàlid)
    if (err.name === 'CastError') {
        return res.status(400).json({
            success: false,
            message: 'Invalid ID format'
        });
    }

    // Error de duplicat (unique constraint)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({
            success: false,
            message: `${field} already exists`
        });
    }

    // Error JWT
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }

    // Error genèric
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal server error'
    });
};

module.exports = errorHandler;
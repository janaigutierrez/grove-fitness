const Joi = require('joi');

const validateUser = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(2).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        weight: Joi.number().min(30).max(200),
        height: Joi.number().min(120).max(220),
        age: Joi.number().min(13).max(100),
        fitness_level: Joi.string().valid('beginner', 'intermediate', 'advanced'),
        onboarding_text: Joi.string().max(1000)
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }
    next();
};

const validateExercise = (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().min(2).max(100).required(),
        type: Joi.string().valid('reps', 'time', 'cardio').required(),
        sets: Joi.number().min(1).max(20),
        reps: Joi.number().min(1).max(100),
        weight: Joi.string().max(20),
        rest_seconds: Joi.number().min(5).max(600),
        duration_seconds: Joi.number().min(5).max(3600),
        distance_km: Joi.number().min(0.1).max(100),
        pace: Joi.string().valid('baixa', 'moderada', 'alta'),
        duration_minutes: Joi.number().min(1).max(300),
        category: Joi.string().max(50),
        difficulty: Joi.string().valid('easy', 'medium', 'hard'),
        notes: Joi.string().max(500)
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ msg: error.details[0].message });
    }
    next();
};

module.exports = {
    validateUser,
    validateExercise
};
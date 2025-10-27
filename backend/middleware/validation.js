const Joi = require('joi');

// ========== SCHEMAS REUTILITZABLES ==========

const userFields = {
    name: Joi.string().min(2).max(50),
    username: Joi.string().min(3).max(30).alphanum().lowercase(),
    email: Joi.string().email(),
    password: Joi.string().min(6),
    weight: Joi.number().min(30).max(200),
    height: Joi.number().min(120).max(220),
    age: Joi.number().min(13).max(100),
    fitness_level: Joi.string().valid('beginner', 'intermediate', 'advanced'),
    onboarding_text: Joi.string().max(1000)
};

const exerciseFields = {
    name: Joi.string().min(2).max(100),
    type: Joi.string().valid('reps', 'time', 'cardio'),
    category: Joi.string().valid('chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio', 'full_body'),
    muscle_groups: Joi.array().items(
        Joi.string().valid('pectoral', 'dorsal', 'trapecio', 'deltoides', 'biceps', 'triceps',
            'cuadriceps', 'isquios', 'gluteos', 'gemelos', 'abdominales', 'oblicuos')
    ),
    equipment: Joi.array().items(
        Joi.string().valid('bodyweight', 'dumbbells', 'barbell', 'pullup_bar', 'resistance_bands',
            'bench', 'kettlebell', 'machine', 'other')
    ),
    default_sets: Joi.number().min(1).max(20),
    default_reps: Joi.number().min(1).max(100),
    default_rest_seconds: Joi.number().min(5).max(600),
    default_duration_seconds: Joi.number().min(5).max(3600),
    default_distance_km: Joi.number().min(0.1).max(100),
    difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced'),
    instructions: Joi.string().max(1000),
    video_url: Joi.string().uri(),
    notes: Joi.string().max(500)
};

// ========== VALIDACIONS ==========

// User - CREATE (name, email, password requerits)
const validateUser = (req, res, next) => {
    const schema = Joi.object({
        name: userFields.name.required(),
        email: userFields.email.required(),
        password: userFields.password.required(),
        username: userFields.username,
        weight: userFields.weight,
        height: userFields.height,
        age: userFields.age,
        fitness_level: userFields.fitness_level,
        onboarding_text: userFields.onboarding_text
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            error: error.details[0].message
        });
    }
    next();
};

// User - UPDATE (tot opcional)
const validateUserUpdate = (req, res, next) => {
    const schema = Joi.object(userFields);

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            error: error.details[0].message
        });
    }
    next();
};

// Exercise - CREATE (name i type requerits)
const validateExercise = (req, res, next) => {
    const schema = Joi.object({
        name: exerciseFields.name.required(),
        type: exerciseFields.type.required(),
        category: exerciseFields.category,
        muscle_groups: exerciseFields.muscle_groups,
        equipment: exerciseFields.equipment,
        default_sets: exerciseFields.default_sets,
        default_reps: exerciseFields.default_reps,
        default_rest_seconds: exerciseFields.default_rest_seconds,
        default_duration_seconds: exerciseFields.default_duration_seconds,
        default_distance_km: exerciseFields.default_distance_km,
        difficulty: exerciseFields.difficulty,
        instructions: exerciseFields.instructions,
        video_url: exerciseFields.video_url,
        notes: exerciseFields.notes
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            error: error.details[0].message
        });
    }
    next();
};

// Exercise - UPDATE (tot opcional)
const validateExerciseUpdate = (req, res, next) => {
    const schema = Joi.object(exerciseFields);

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            error: error.details[0].message
        });
    }
    next();
};

module.exports = {
    validateUser,
    validateUserUpdate,
    validateExercise,
    validateExerciseUpdate
};
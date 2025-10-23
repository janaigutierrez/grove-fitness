const Exercise = require('../models/Exercise');
const mongoose = require('mongoose');

// Get all exercises (con filtros avanzados)
const getExercises = async (req, res) => {
    try {
        const {
            type,
            category,
            equipment,
            difficulty,
            muscle_group,
            is_custom,
            search
        } = req.query;

        let filter = {
            $or: [
                { user_id: req.user._id }, // Ejercicios del usuario
                { is_custom: false }        // Ejercicios predefinidos (públicos)
            ]
        };

        // Filtros opcionales
        if (type) filter.type = type;
        if (category) filter.category = category;
        if (difficulty) filter.difficulty = difficulty;
        if (is_custom !== undefined) filter.is_custom = is_custom === 'true';

        // Filtro por equipo
        if (equipment) {
            filter.equipment = { $in: [equipment] };
        }

        // Filtro por grupo muscular
        if (muscle_group) {
            filter.muscle_groups = { $in: [muscle_group] };
        }

        // Búsqueda por nombre
        if (search) {
            filter.name = { $regex: search, $options: 'i' };
        }

        const exercises = await Exercise.find(filter)
            .sort({ times_performed: -1, createdAt: -1 });

        res.json(exercises);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Get single exercise
const getExercise = async (req, res) => {
    try {
        // Validar ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid exercise ID' });
        }

        const exercise = await Exercise.findOne({
            _id: req.params.id,
            $or: [
                { user_id: req.user._id },
                { is_custom: false }
            ]
        });

        if (!exercise) {
            return res.status(404).json({ msg: 'Exercise not found' });
        }

        res.json(exercise);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Create exercise
const createExercise = async (req, res) => {
    try {
        const exerciseData = {
            ...req.body,
            user_id: req.user._id,
            is_custom: true
        };

        const exercise = new Exercise(exerciseData);
        await exercise.save();

        res.json(exercise);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Update exercise
const updateExercise = async (req, res) => {
    try {
        // Validar ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid exercise ID' });
        }

        let exercise = await Exercise.findOne({
            _id: req.params.id,
            user_id: req.user._id // Solo el dueño puede editar
        });

        if (!exercise) {
            return res.status(404).json({ msg: 'Exercise not found or not authorized' });
        }

        exercise = await Exercise.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        );

        res.json(exercise);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Delete exercise
const deleteExercise = async (req, res) => {
    try {
        // Validar ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid exercise ID' });
        }

        const exercise = await Exercise.findOne({
            _id: req.params.id,
            user_id: req.user._id
        });

        if (!exercise) {
            return res.status(404).json({ msg: 'Exercise not found or not authorized' });
        }

        await Exercise.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Exercise removed' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Get exercises by category
const getByCategory = async (req, res) => {
    try {
        const exercises = await Exercise.find({
            $or: [
                { user_id: req.user._id },
                { is_custom: false }
            ]
        }).sort({ category: 1, name: 1 });

        // Agrupar por categoría
        const grouped = exercises.reduce((acc, exercise) => {
            const category = exercise.category || 'other';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(exercise);
            return acc;
        }, {});

        res.json(grouped);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Get exercises by muscle group
const getByMuscleGroup = async (req, res) => {
    try {
        const exercises = await Exercise.find({
            $or: [
                { user_id: req.user._id },
                { is_custom: false }
            ]
        });

        // Agrupar por grupo muscular
        const grouped = {};

        exercises.forEach(exercise => {
            exercise.muscle_groups.forEach(muscle => {
                if (!grouped[muscle]) {
                    grouped[muscle] = [];
                }
                grouped[muscle].push(exercise);
            });
        });

        res.json(grouped);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Get most used exercises
const getMostUsed = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const exercises = await Exercise.find({
            user_id: req.user._id,
            times_performed: { $gt: 0 }
        })
            .sort({ times_performed: -1 })
            .limit(limit);

        res.json(exercises);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Get available equipment (unique list)
const getAvailableEquipment = async (req, res) => {
    try {
        const exercises = await Exercise.find({
            $or: [
                { user_id: req.user._id },
                { is_custom: false }
            ]
        });

        // Extraer equipamiento único
        const equipmentSet = new Set();
        exercises.forEach(exercise => {
            exercise.equipment.forEach(eq => equipmentSet.add(eq));
        });

        res.json(Array.from(equipmentSet).sort());
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Seed predefined exercises (admin only o primera vez)
const seedExercises = async (req, res) => {
    try {
        // Verificar si ya hay ejercicios predefinidos
        const existingCount = await Exercise.countDocuments({ is_custom: false });

        if (existingCount > 0) {
            return res.status(400).json({ msg: 'Predefined exercises already exist' });
        }

        // Ejercicios predefinidos básicos
        const predefinedExercises = [
            {
                name: 'Flexiones',
                type: 'reps',
                category: 'chest',
                muscle_groups: ['pectoral', 'triceps', 'deltoides'],
                equipment: ['bodyweight'],
                default_sets: 3,
                default_reps: 12,
                default_rest_seconds: 60,
                difficulty: 'beginner',
                is_custom: false,
                instructions: 'Mantén el cuerpo recto, baja hasta que el pecho casi toque el suelo.'
            },
            {
                name: 'Dominadas',
                type: 'reps',
                category: 'back',
                muscle_groups: ['dorsal', 'biceps'],
                equipment: ['pullup_bar'],
                default_sets: 3,
                default_reps: 8,
                default_rest_seconds: 90,
                difficulty: 'intermediate',
                is_custom: false,
                instructions: 'Agarre prono, subir hasta barbilla sobre la barra.'
            },
            {
                name: 'Sentadillas',
                type: 'reps',
                category: 'legs',
                muscle_groups: ['cuadriceps', 'gluteos'],
                equipment: ['bodyweight'],
                default_sets: 3,
                default_reps: 15,
                default_rest_seconds: 60,
                difficulty: 'beginner',
                is_custom: false,
                instructions: 'Bajar hasta que los muslos estén paralelos al suelo.'
            },
            {
                name: 'Plancha',
                type: 'time',
                category: 'core',
                muscle_groups: ['abdominales', 'oblicuos'],
                equipment: ['bodyweight'],
                default_sets: 3,
                default_duration_seconds: 30,
                default_rest_seconds: 45,
                difficulty: 'beginner',
                is_custom: false,
                instructions: 'Mantén el cuerpo recto desde cabeza hasta pies.'
            },
            // Añade más ejercicios predefinidos aquí...
        ];

        const created = await Exercise.insertMany(predefinedExercises);

        res.json({
            msg: `${created.length} ejercicios predefinidos creados`,
            exercises: created
        });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

module.exports = {
    getExercises,
    getExercise,
    createExercise,
    updateExercise,
    deleteExercise,
    getByCategory,
    getByMuscleGroup,
    getMostUsed,
    getAvailableEquipment,
    seedExercises
};
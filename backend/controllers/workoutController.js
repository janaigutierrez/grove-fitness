const Workout = require('../models/Workout');
const Exercise = require('../models/Exercise');
const mongoose = require('mongoose');

// Helper: Calcular duración estimada
const calculateEstimatedDuration = (exercises) => {
    let totalMinutes = 0;

    exercises.forEach(ex => {
        const sets = ex.custom_sets || ex.exercise_id?.default_sets || 3;
        const restSeconds = ex.custom_rest_seconds || ex.exercise_id?.default_rest_seconds || 60;

        // Tiempo por set (asumimos 30-60 segundos por set de fuerza)
        const timePerSet = 45; // segundos promedio

        // Total = (sets * tiempo_por_set) + (descansos entre sets)
        const exerciseTime = (sets * timePerSet) + ((sets - 1) * restSeconds);
        totalMinutes += exerciseTime / 60;
    });

    return Math.ceil(totalMinutes);
};

// Get all user workouts
const getWorkouts = async (req, res) => {
    try {
        const { workout_type, is_template, is_favorite } = req.query;

        let filter = { user_id: req.user._id };
        if (workout_type) filter.workout_type = workout_type;
        if (is_template !== undefined) filter.is_template = is_template === 'true';
        if (is_favorite !== undefined) filter.is_favorite = is_favorite === 'true';

        const workouts = await Workout.find(filter)
            .populate({
                path: 'exercises.exercise_id',
                select: 'name type category muscle_groups equipment difficulty'
            })
            .sort({ createdAt: -1 });

        res.json(workouts);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Get single workout
const getWorkout = async (req, res) => {
    try {
        // Validar ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid workout ID' });
        }

        const workout = await Workout.findOne({
            _id: req.params.id,
            user_id: req.user._id
        }).populate('exercises.exercise_id');

        if (!workout) {
            return res.status(404).json({ msg: 'Workout not found' });
        }

        res.json(workout);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Create workout
const createWorkout = async (req, res) => {
    try {
        const { name, exercises, workout_type, difficulty, description, ai_generated, ai_prompt } = req.body;

        // Validar que hay ejercicios
        if (!exercises || exercises.length === 0) {
            return res.status(400).json({ msg: 'Workout must have at least one exercise' });
        }

        // Validar ObjectIds de exercises
        const exerciseIds = exercises.map(e => e.exercise_id);
        const invalidIds = exerciseIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            return res.status(400).json({ msg: 'Invalid exercise IDs detected' });
        }

        // Validar que los ejercicios existen y son accesibles
        const validExercises = await Exercise.find({
            _id: { $in: exerciseIds }
        });

        if (validExercises.length !== exerciseIds.length) {
            return res.status(400).json({ msg: 'Some exercises not found' });
        }

        // Asegurar que cada ejercicio tiene un order
        const orderedExercises = exercises.map((ex, idx) => ({
            ...ex,
            order: ex.order !== undefined ? ex.order : idx + 1
        }));

        // Ordenar por order
        orderedExercises.sort((a, b) => a.order - b.order);

        // Calcular duración estimada
        const estimated_duration = calculateEstimatedDuration(
            orderedExercises.map(ex => ({
                ...ex,
                exercise_id: validExercises.find(ve => ve._id.toString() === ex.exercise_id.toString())
            }))
        );

        // Crear workout
        const workout = new Workout({
            name,
            user_id: req.user._id,
            description,
            exercises: orderedExercises,
            workout_type: workout_type || 'custom',
            difficulty,
            estimated_duration_minutes: estimated_duration,
            ai_generated: ai_generated || false,
            ai_prompt: ai_prompt || null
        });

        await workout.save();

        // Populate antes de devolver
        await workout.populate('exercises.exercise_id', 'name type category muscle_groups equipment');

        res.json(workout);
    } catch (error) {
        console.error('Create workout error:', error.message);
        res.status(500).send('Server error');
    }
};

// Update workout
const updateWorkout = async (req, res) => {
    try {
        // Validar ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid workout ID' });
        }

        let workout = await Workout.findOne({
            _id: req.params.id,
            user_id: req.user._id
        });

        if (!workout) {
            return res.status(404).json({ msg: 'Workout not found' });
        }

        // Si se actualizan ejercicios, validarlos
        if (req.body.exercises) {
            const exerciseIds = req.body.exercises.map(e => e.exercise_id);
            const invalidIds = exerciseIds.filter(id => !mongoose.Types.ObjectId.isValid(id));

            if (invalidIds.length > 0) {
                return res.status(400).json({ msg: 'Invalid exercise IDs detected' });
            }

            const validExercises = await Exercise.find({
                _id: { $in: exerciseIds }
            });

            if (validExercises.length !== exerciseIds.length) {
                return res.status(400).json({ msg: 'Some exercises not found' });
            }

            // Asegurar order
            req.body.exercises = req.body.exercises.map((ex, idx) => ({
                ...ex,
                order: ex.order !== undefined ? ex.order : idx + 1
            }));

            // Recalcular duración
            req.body.estimated_duration_minutes = calculateEstimatedDuration(
                req.body.exercises.map(ex => ({
                    ...ex,
                    exercise_id: validExercises.find(ve => ve._id.toString() === ex.exercise_id.toString())
                }))
            );
        }

        // Actualizar
        workout = await Workout.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        ).populate('exercises.exercise_id', 'name type category muscle_groups equipment');

        res.json(workout);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Delete workout
const deleteWorkout = async (req, res) => {
    try {
        // Validar ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid workout ID' });
        }

        const workout = await Workout.findOne({
            _id: req.params.id,
            user_id: req.user._id
        });

        if (!workout) {
            return res.status(404).json({ msg: 'Workout not found' });
        }

        await Workout.findByIdAndDelete(req.params.id);
        res.json({ msg: 'Workout removed' });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Duplicate workout
const duplicateWorkout = async (req, res) => {
    try {
        // Validar ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid workout ID' });
        }

        const originalWorkout = await Workout.findOne({
            _id: req.params.id,
            user_id: req.user._id
        });

        if (!originalWorkout) {
            return res.status(404).json({ msg: 'Workout not found' });
        }

        const duplicatedWorkout = new Workout({
            name: `${originalWorkout.name} (Copia)`,
            user_id: req.user._id,
            description: originalWorkout.description,
            exercises: originalWorkout.exercises,
            workout_type: originalWorkout.workout_type,
            difficulty: originalWorkout.difficulty,
            estimated_duration_minutes: originalWorkout.estimated_duration_minutes,
            ai_generated: false
        });

        await duplicatedWorkout.save();
        await duplicatedWorkout.populate('exercises.exercise_id', 'name type category muscle_groups equipment');

        res.json(duplicatedWorkout);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Reorder exercises in workout
const reorderExercises = async (req, res) => {
    try {
        const { exerciseOrder } = req.body; // Array de { exercise_id, order }

        // Validar ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid workout ID' });
        }

        const workout = await Workout.findOne({
            _id: req.params.id,
            user_id: req.user._id
        });

        if (!workout) {
            return res.status(404).json({ msg: 'Workout not found' });
        }

        // Actualizar orden
        exerciseOrder.forEach(({ exercise_id, order }) => {
            const exercise = workout.exercises.find(
                ex => ex.exercise_id.toString() === exercise_id.toString()
            );
            if (exercise) {
                exercise.order = order;
            }
        });

        // Ordenar
        workout.exercises.sort((a, b) => a.order - b.order);

        await workout.save();
        await workout.populate('exercises.exercise_id', 'name type category muscle_groups equipment');

        res.json(workout);
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

// Toggle favorite
const toggleFavorite = async (req, res) => {
    try {
        // Validar ObjectId
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ msg: 'Invalid workout ID' });
        }

        const workout = await Workout.findOne({
            _id: req.params.id,
            user_id: req.user._id
        });

        if (!workout) {
            return res.status(404).json({ msg: 'Workout not found' });
        }

        workout.is_favorite = !workout.is_favorite;
        await workout.save();

        res.json({ is_favorite: workout.is_favorite });
    } catch (error) {
        console.error(error.message);
        res.status(500).send('Server error');
    }
};

module.exports = {
    getWorkouts,
    getWorkout,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    duplicateWorkout,
    reorderExercises,
    toggleFavorite
};
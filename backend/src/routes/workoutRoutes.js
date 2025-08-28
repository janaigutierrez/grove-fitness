const express = require('express');
const router = express.Router();
const workoutController = require('../controllers/workoutController');

router.get('/', workoutController.getAllWorkouts);
router.post('/', workoutController.createWorkout);
router.delete('/:id', workoutController.deleteWorkout);

module.exports = router;
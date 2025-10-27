const scheduleService = require('../services/scheduleServices');

const getWeeklySchedule = async (req, res, next) => {
    try {
        const schedule = await scheduleService.getWeeklySchedule(req.user._id);
        res.json(schedule);
    } catch (error) {
        next(error);
    }
};

const updateWeeklySchedule = async (req, res, next) => {
    try {
        const schedule = await scheduleService.updateWeeklySchedule(req.user._id, req.body);
        res.json(schedule);
    } catch (error) {
        next(error);
    }
};

const getTodayWorkout = async (req, res, next) => {
    try {
        const result = await scheduleService.getTodayWorkout(req.user._id);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getWeeklySchedule,
    updateWeeklySchedule,
    getTodayWorkout
};
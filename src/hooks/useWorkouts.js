import { useState, useEffect, useCallback } from 'react';
import {
  getWorkouts,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  duplicateWorkout,
} from '../services/api';

/**
 * Hook for workout management
 *
 * Usage:
 * const { workouts, loading, createNew, refresh } = useWorkouts();
 */
export default function useWorkouts(filters = {}) {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadWorkouts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWorkouts(filters);
      setWorkouts(data);
      return data;
    } catch (err) {
      setError(err.message);
      console.error('Error loading workouts:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  const createNew = useCallback(async (workoutData) => {
    try {
      const newWorkout = await createWorkout(workoutData);
      setWorkouts(prev => [...prev, newWorkout]);
      return newWorkout;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const update = useCallback(async (id, updates) => {
    try {
      const updated = await updateWorkout(id, updates);
      setWorkouts(prev =>
        prev.map(w => (w.id === id ? updated : w))
      );
      return updated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const remove = useCallback(async (id) => {
    try {
      await deleteWorkout(id);
      setWorkouts(prev => prev.filter(w => w.id !== id));
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const duplicate = useCallback(async (id) => {
    try {
      const duplicated = await duplicateWorkout(id);
      setWorkouts(prev => [...prev, duplicated]);
      return duplicated;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const refresh = useCallback(() => {
    return loadWorkouts();
  }, [loadWorkouts]);

  useEffect(() => {
    loadWorkouts();
  }, [loadWorkouts]);

  return {
    workouts,
    loading,
    error,
    createNew,
    update,
    remove,
    duplicate,
    refresh,
  };
}

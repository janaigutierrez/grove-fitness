import { useState, useEffect, useCallback } from 'react';
import { getCurrentUser, updateUserProfile } from '../services/api';

/**
 * Hook for user management
 *
 * Usage:
 * const { user, loading, updateUser, refreshUser } = useUser();
 */
export default function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userData = await getCurrentUser();
      setUser(userData);
      return userData;
    } catch (err) {
      setError(err.message);
      console.error('Error loading user:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUser = useCallback(async (updates) => {
    try {
      const updatedUser = await updateUserProfile(updates);
      setUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, []);

  const refreshUser = useCallback(() => {
    return loadUser();
  }, [loadUser]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return {
    user,
    setUser, // For local updates (avatar, etc.)
    loading,
    error,
    updateUser,
    refreshUser,
  };
}

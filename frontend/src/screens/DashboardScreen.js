import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ImageBackground, ActivityIndicator, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '../components/common/ProgressBar';
import Header from '../components/common/Header';
import { getUserStats, getTodayWorkout } from '../services/api';
import { handleApiError } from '../utils/errorHandler';

export default function DashboardScreen({ user }) {
  const [stats, setStats] = useState(null);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Carregar estadístiques i workout d'avui en paral·lel
      const [statsData, todayData] = await Promise.all([
        getUserStats(),
        getTodayWorkout()
      ]);

      console.log('✅ Stats carregades:', statsData);
      console.log('✅ Workout d\'avui:', todayData);

      setStats(statsData);
      setTodayWorkout(todayData);

    } catch (error) {
      console.error('❌ Error carregant dashboard:', error);
      const errorInfo = handleApiError(error);
      Alert.alert(errorInfo.title, errorInfo.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
  };

  // Calcular nivell basat en workouts completats
  const calculateLevel = (totalWorkouts) => {
    return Math.floor(totalWorkouts / 4) + 1; // 1 nivell cada 4 workouts
  };

  // Calcular progrés fins al següent nivell
  const calculateLevelProgress = (totalWorkouts) => {
    const workoutsInCurrentLevel = totalWorkouts % 4;
    return workoutsInCurrentLevel / 4; // 0 a 1
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <LinearGradient
          colors={['rgba(76, 175, 80, 0.9)', 'rgba(45, 80, 22, 0.95)']}
          style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color="white" />
          <Text style={{ color: 'white', marginTop: 10 }}>Carregant dashboard...</Text>
        </LinearGradient>
      </View>
    );
  }

  const userLevel = stats ? calculateLevel(stats.totalWorkouts) : 1;
  const levelProgress = stats ? calculateLevelProgress(stats.totalWorkouts) : 0;

  return (
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={{ uri: 'https://www.transparenttextures.com/patterns/green-fibers.png' }}
        resizeMode="repeat"
        style={styles.background}
      >
        <LinearGradient
          colors={['rgba(76, 175, 80, 0.9)', 'rgba(45, 80, 22, 0.95)']}
          style={styles.container}
        >
          <Header title="Grove" />

          <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="white"
                colors={['white']}
              />
            }
          >
            {/* Avatar i usuari */}
            <View style={styles.avatarSection}>
              {user?.avatar_url ? (
                <Image
                  source={{ uri: user.avatar_url }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitials}>
                    {user?.name?.charAt(0).toUpperCase() || 'G'}
                  </Text>
                </View>
              )}
              <Text style={styles.username}>{user?.name || 'Grove User'}</Text>
              <Text style={styles.level}>Nivell {userLevel} 🔥</Text>

              {/* Barra de progrés del nivell */}
              <View style={styles.levelProgressContainer}>
                <ProgressBar progress={levelProgress} color="#FFD700" />
                <Text style={styles.levelProgressText}>
                  {stats ? `${stats.totalWorkouts % 4}/4 workouts fins nivell ${userLevel + 1}` : ''}
                </Text>
              </View>
            </View>

            {/* Estadístiques reals */}
            {stats && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>📊 Les teves estadístiques</Text>

                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{stats.totalWorkouts}</Text>
                    <Text style={styles.statLabel}>Workouts</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{stats.thisWeekWorkouts}</Text>
                    <Text style={styles.statLabel}>Aquesta setmana</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{stats.currentStreak}</Text>
                    <Text style={styles.statLabel}>Dies de ratxa</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{stats.totalExercises}</Text>
                    <Text style={styles.statLabel}>Exercicis</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Workout d'avui */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>📅 Workout d'avui</Text>
              {todayWorkout?.workout ? (
                <View>
                  <View style={styles.todayWorkoutHeader}>
                    <Ionicons name="barbell" size={24} color="white" />
                    <Text style={styles.todayWorkoutTitle}>{todayWorkout.workout.name}</Text>
                  </View>
                  <Text style={styles.todayWorkoutDetail}>
                    ⏱ {todayWorkout.workout.estimated_duration || 30} minuts
                  </Text>
                  <Text style={styles.todayWorkoutDetail}>
                    💪 {todayWorkout.workout.difficulty || 'intermediate'}
                  </Text>
                  <Text style={styles.todayWorkoutDetail}>
                    🎯 {todayWorkout.workout.exercises?.length || 0} exercicis
                  </Text>

                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => Alert.alert('Workout', 'Navegar a WorkoutScreen per començar!')}
                  >
                    <Ionicons name="play" size={18} color="white" />
                    <Text style={styles.startButtonText}>COMENÇAR ENTRENO</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.noWorkout}>
                  <Ionicons name="calendar-outline" size={48} color="rgba(255,255,255,0.5)" />
                  <Text style={styles.noWorkoutText}>
                    {todayWorkout?.message || 'No tens cap workout programat per avui'}
                  </Text>
                  <Text style={styles.noWorkoutSubtext}>
                    Dia de descans o crea un workout nou! 😊
                  </Text>
                </View>
              )}
            </View>

            {/* Sessions recents */}
            {stats?.recentSessions && stats.recentSessions.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>🏆 Sessions recents</Text>
                {stats.recentSessions.slice(0, 3).map((session, index) => (
                  <View key={index} style={styles.sessionItem}>
                    <View style={styles.sessionIcon}>
                      <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                    </View>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionName}>
                        {session.workout_id?.name || 'Workout'}
                      </Text>
                      <Text style={styles.sessionDate}>
                        {new Date(session.completed_at).toLocaleDateString('ca-ES')}
                      </Text>
                    </View>
                    <View style={styles.sessionStats}>
                      <Text style={styles.sessionDuration}>
                        ⏱ {session.total_duration_minutes}min
                      </Text>
                      {session.total_volume_kg > 0 && (
                        <Text style={styles.sessionVolume}>
                          💪 {session.total_volume_kg}kg
                        </Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Motivació */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>🔥 Motivació</Text>
              <Text style={styles.sectionText}>
                {stats?.currentStreak > 0
                  ? `Portes ${stats.currentStreak} dies de ratxa! Continua així! 💪`
                  : "Els petits hàbits creen grans resultats. Comença avui! 🌱"
                }
              </Text>
            </View>

            {/* Chat IA (preview) */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>🤖 Coach IA</Text>
              <TouchableOpacity
                style={styles.chatPreview}
                onPress={() => Alert.alert('Chat IA', 'Funcionalitat disponible aviat!')}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={24} color="white" />
                <Text style={styles.chatPreviewText}>
                  Parla amb el teu coach personalitzat...
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'white',
    marginBottom: 15,
  },
  avatarPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  level: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 5,
  },
  levelProgressContainer: {
    width: '80%',
    marginTop: 15,
  },
  levelProgressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 5,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 4,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  statBox: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  todayWorkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  todayWorkoutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 10,
  },
  todayWorkoutDetail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 6,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 15,
  },
  startButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 8,
  },
  noWorkout: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noWorkoutText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  noWorkoutSubtext: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  sessionIcon: {
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  sessionStats: {
    alignItems: 'flex-end',
  },
  sessionDuration: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 2,
  },
  sessionVolume: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
  },
  chatPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 16,
  },
  chatPreviewText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    marginLeft: 12,
  },
});
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ImageBackground, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Dumbbell, Flame, Calendar, TrendingUp, Target, BarChart2, CheckCircle, Clock, Play } from 'lucide-react-native';
import ProgressBar from '../components/common/ProgressBar';
import Header from '../components/common/Header';
import { getUserStats, getTodayWorkout } from '../services/api';
import { handleApiError, formatSuccessMessage } from '../utils/errorHandler';
import ErrorModal from '../components/common/ErrorModal';
import InfoModal from '../components/common/InfoModal';
import useModal from '../hooks/useModal';
import { useAuth } from '../context/AuthContext';
import colors from '../constants/colors';

export default function DashboardScreen() {
  const { user } = useAuth();
  const isFocused = useIsFocused();
  const [stats, setStats] = useState(null);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // System modals
  const errorModal = useModal();
  const infoModal = useModal();

  // Load only when screen comes into focus (avoids double-fire on mount)
  useEffect(() => {
    if (isFocused) {
      loadDashboardData();
    }
  }, [isFocused]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Carregar estadístiques i workout d'avui en paral·lel
      const [statsData, todayData] = await Promise.all([
        getUserStats(),
        getTodayWorkout()
      ]);


      setStats(statsData);
      setTodayWorkout(todayData);

    } catch (error) {
      const errorInfo = handleApiError(error);
      errorModal.openModal({
        title: errorInfo.title,
        message: errorInfo.message,
        icon: errorInfo.icon,
      });
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

  // Pool de frases motivacionals
  const getMotivationalPhrase = () => {
    const phrases = {
      highStreak: [
        `Increïble! ${stats?.currentStreak} dies consecutius entrenant. Ets imparable!`,
        `${stats?.currentStreak} dies de ratxa! El teu cos t'ho agrairà.`,
        `${stats?.currentStreak} dies sense parar! La constància és la clau de l'èxit.`,
        `${stats?.currentStreak} dies seguint amb disciplina. Així s'aconsegueixen resultats!`,
      ],
      mediumStreak: [
        `${stats?.currentStreak} dies de ratxa! Vas per bon camí, continua així!`,
        `${stats?.currentStreak} dies amb determinació. Cada dia compta!`,
        `Portes ${stats?.currentStreak} dies entrenant. El progrés és inevitable!`,
        `${stats?.currentStreak} dies carregant energia. Segueix endavant!`,
      ],
      lowStreak: [
        `${stats?.currentStreak} dies! Els petits hàbits creen grans resultats.`,
        `${stats?.currentStreak} dies i comptant. Cada començament és important!`,
        `${stats?.currentStreak} dies d'esforç. El camí de mil milles comença amb un pas.`,
        `${stats?.currentStreak} dies cap al teu objectiu. Continua construint!`,
      ],
      noStreak: [
        "Els petits hàbits creen grans resultats. Comença avui!",
        "El millor moment per començar és ara. El teu cos t'ho agrairà!",
        "Cada expert va ser un principiant. Fes el primer pas!",
        "La motivació és el que et posa en marxa, l'hàbit és el que et manté.",
        "No cal ser gran per començar, però cal començar per ser gran.",
      ],
      manyWorkouts: [
        `${stats?.totalWorkouts} workouts completats! Ets una màquina!`,
        `${stats?.totalWorkouts} sessions a la butxaca. El treball dur paga!`,
        `${stats?.totalWorkouts} workouts i comptant. Imparable!`,
      ],
      thisWeek: [
        `${stats?.thisWeekWorkouts} workouts aquesta setmana! Quina consistència!`,
        `Ja portes ${stats?.thisWeekWorkouts} sessions aquesta setmana. Fantàstic!`,
        `${stats?.thisWeekWorkouts} workouts aquesta setmana. Així es fa!`,
      ],
    };

    // Seleccionar categoria segons stats
    let category;
    const streak = stats?.currentStreak || 0;
    const totalWorkouts = stats?.totalWorkouts || 0;
    const thisWeek = stats?.thisWeekWorkouts || 0;

    if (totalWorkouts >= 50) {
      category = 'manyWorkouts';
    } else if (thisWeek >= 3) {
      category = 'thisWeek';
    } else if (streak >= 7) {
      category = 'highStreak';
    } else if (streak >= 3) {
      category = 'mediumStreak';
    } else if (streak >= 1) {
      category = 'lowStreak';
    } else {
      category = 'noStreak';
    }

    const categoryPhrases = phrases[category];
    return categoryPhrases[Math.floor(Math.random() * categoryPhrases.length)];
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <LinearGradient
          colors={['rgba(76, 175, 80, 0.9)', 'rgba(45, 80, 22, 0.95)']}
          style={{ flex: 1, width: '100%', justifyContent: 'center', alignItems: 'center' }}
        >
          <ActivityIndicator size="large" color="white" />
          <Text style={{ color: colors.text.inverse, marginTop: 10 }}>Carregant dashboard...</Text>
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
                colors={[colors.text.inverse]}
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
              <View style={styles.levelContainer}>
                <Flame size={16} color="rgba(255,255,255,0.8)" />
                <Text style={styles.level}> Nivell {userLevel}</Text>
              </View>

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
                <View style={styles.sectionTitleContainer}>
                  <BarChart2 size={20} color="white" />
                  <Text style={styles.sectionTitle}> Les teves estadístiques</Text>
                </View>

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
                    <Text style={styles.statNumber}>{stats.totalRepsCompleted || 0}</Text>
                    <Text style={styles.statLabel}>Reps totals</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Workout d'avui */}
            <View style={styles.card}>
              <View style={styles.sectionTitleContainer}>
                <Calendar size={20} color="white" />
                <Text style={styles.sectionTitle}> Workout d'avui</Text>
              </View>
              {todayWorkout?.workout ? (
                <View>
                  <View style={styles.todayWorkoutHeader}>
                    <Dumbbell size={24} color="white" />
                    <Text style={styles.todayWorkoutTitle}>{todayWorkout.workout.name}</Text>
                  </View>
                  <View style={styles.todayWorkoutDetailRow}>
                    <Clock size={16} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.todayWorkoutDetail}>
                      {todayWorkout.workout.estimated_duration || 30} minuts
                    </Text>
                  </View>
                  <View style={styles.todayWorkoutDetailRow}>
                    <TrendingUp size={16} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.todayWorkoutDetail}>
                      {todayWorkout.workout.difficulty || 'intermediate'}
                    </Text>
                  </View>
                  <View style={styles.todayWorkoutDetailRow}>
                    <Target size={16} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.todayWorkoutDetail}>
                      {todayWorkout.workout.exercises?.length || 0} exercicis
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() => {
                      const infoMessage = formatSuccessMessage('Navega a la pestanya Workout per començar!', 'info');
                      infoModal.openModal({
                        title: 'Workout',
                        message: infoMessage.message,
                        icon: infoMessage.icon,
                        onClose: infoModal.closeModal,
                      });
                    }}
                  >
                    <Play size={18} color="white" fill="white" />
                    <Text style={styles.startButtonText}>COMENÇAR ENTRENO</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.noWorkout}>
                  <Calendar size={48} color="rgba(255,255,255,0.5)" />
                  <Text style={styles.noWorkoutText}>
                    {todayWorkout?.message || 'No tens cap workout programat per avui'}
                  </Text>
                  <Text style={styles.noWorkoutSubtext}>
                    Dia de descans o crea un workout nou!
                  </Text>
                </View>
              )}
            </View>

            {/* Sessions recents */}
            {stats?.recentSessions && stats.recentSessions.length > 0 && (
              <View style={styles.card}>
                <View style={styles.sectionTitleContainer}>
                  <CheckCircle size={20} color="white" />
                  <Text style={styles.sectionTitle}> Sessions recents</Text>
                </View>
                {stats.recentSessions.slice(0, 3).map((session, index) => (
                  <View key={index} style={styles.sessionItem}>
                    <View style={styles.sessionIcon}>
                      <CheckCircle size={24} color="#4CAF50" />
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
                      <View style={styles.sessionStatRow}>
                        <Clock size={12} color="rgba(255,255,255,0.9)" />
                        <Text style={styles.sessionDuration}>
                          {session.total_duration_minutes}min
                        </Text>
                      </View>
                      {session.total_volume_kg > 0 && (
                        <View style={styles.sessionStatRow}>
                          <Dumbbell size={12} color="rgba(255,255,255,0.9)" />
                          <Text style={styles.sessionVolume}>
                            {session.total_volume_kg}kg
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Motivació */}
            <View style={styles.card}>
              <View style={styles.sectionTitleContainer}>
                <Flame size={20} color="white" />
                <Text style={styles.sectionTitle}> Motivació</Text>
              </View>
              <Text style={styles.sectionText}>
                {getMotivationalPhrase()}
              </Text>
            </View>
          </ScrollView>

          {/* System Modals */}
          <ErrorModal
            visible={errorModal.visible}
            title={errorModal.modalData.title}
            message={errorModal.modalData.message}
            icon={errorModal.modalData.icon}
            onClose={errorModal.modalData.onClose || errorModal.closeModal}
          />
          <InfoModal
            visible={infoModal.visible}
            title={infoModal.modalData.title}
            message={infoModal.modalData.message}
            icon={infoModal.modalData.icon}
            onClose={infoModal.modalData.onClose || infoModal.closeModal}
          />
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
    borderColor: colors.text.inverse,
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
    color: colors.text.inverse,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text.inverse,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  level: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
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
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.inverse,
  },
  sectionText: {
    fontSize: 14,
    color: colors.text.inverse,
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
    color: colors.text.inverse,
    marginLeft: 10,
  },
  todayWorkoutDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  todayWorkoutDetail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 6,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 15,
  },
  startButtonText: {
    color: colors.text.inverse,
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
    color: colors.text.inverse,
    marginBottom: 4,
  },
  sessionDate: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  sessionStats: {
    alignItems: 'flex-end',
  },
  sessionStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  sessionDuration: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 4,
  },
  sessionVolume: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginLeft: 4,
  },
});
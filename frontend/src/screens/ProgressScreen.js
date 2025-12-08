import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, Dumbbell, Scale, PlusCircle, Activity, CheckCircle, Calendar } from 'lucide-react-native';
import { LineChart } from 'react-native-chart-kit';
import {
  getWeightHistory,
  addWeightEntry,
  getUserStats,
  getWorkoutSessions
} from '../services/api';
import { handleApiError, formatSuccessMessage, ValidationError } from '../utils/errorHandler';
import AddWeightModal from '../components/progress/AddWeightModal';
import ErrorModal from '../components/common/ErrorModal';
import InfoModal from '../components/common/InfoModal';
import useModal from '../hooks/useModal';
import colors from '../constants/colors';

const screenWidth = Dimensions.get('window').width;

export default function ProgressScreen() {
  const [weightHistory, setWeightHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [addWeightModal, setAddWeightModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');

  // System modals
  const errorModal = useModal();
  const infoModal = useModal();

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      const [weightData, statsData, sessionsData] = await Promise.all([
        getWeightHistory(30),
        getUserStats(),
        getWorkoutSessions({ limit: 10, status: 'completed' })
      ]);

      setWeightHistory(weightData.weight_history || []);
      setStats(statsData);
      setRecentSessions(sessionsData.sessions || []);
    } catch (error) {
      const errorInfo = handleApiError(error);
      errorModal.openModal({
        title: errorInfo.title,
        message: errorInfo.message,
        icon: errorInfo.icon,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProgressData();
    setRefreshing(false);
  };

  const handleAddWeight = async () => {
    const weight = parseFloat(newWeight);

    if (isNaN(weight) || weight <= 0 || weight > 500) {
      const validationError = new ValidationError('Por favor ingresa un peso válido (0-500 kg)', 'weight');
      const errorInfo = handleApiError(validationError);
      errorModal.openModal({
        title: errorInfo.title,
        message: errorInfo.message,
        icon: errorInfo.icon,
      });
      return;
    }

    try {
      setLoading(true);
      await addWeightEntry(weight);
      await loadProgressData();
      setAddWeightModal(false);
      setNewWeight('');
      const successInfo = formatSuccessMessage('Peso registrado correctamente');
      infoModal.openModal({
        title: successInfo.title,
        message: successInfo.message,
        icon: successInfo.icon,
      });
    } catch (error) {
      const errorInfo = handleApiError(error);
      errorModal.openModal({
        title: errorInfo.title,
        message: errorInfo.message,
        icon: errorInfo.icon,
      });
    } finally {
      setLoading(false);
    }
  };

  const getWeightChange = () => {
    if (weightHistory.length < 2) return null;
    const latest = weightHistory[0].weight;
    const oldest = weightHistory[weightHistory.length - 1].weight;
    const change = latest - oldest;
    return change;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.getDate()}/${date.getMonth() + 1}`;
  };

  const getChartData = () => {
    if (weightHistory.length === 0) {
      return {
        labels: ['Sin datos'],
        datasets: [{ data: [0] }]
      };
    }

    // Revertir para mostrar de más antiguo a más reciente
    const reversedHistory = [...weightHistory].reverse();

    // Si hay muchos puntos, tomar solo algunos para el gráfico
    const maxPoints = 10;
    const step = Math.ceil(reversedHistory.length / maxPoints);
    const sampledData = reversedHistory.filter((_, index) => index % step === 0);

    return {
      labels: sampledData.map(entry => formatDate(entry.date)),
      datasets: [
        {
          data: sampledData.map(entry => entry.weight),
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          strokeWidth: 3
        }
      ]
    };
  };

  if (loading && !stats) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando progreso...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const weightChange = getWeightChange();
  const chartData = getChartData();
  const currentWeight = weightHistory.length > 0 ? weightHistory[0].weight : null;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      >
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <TrendingUp size={28} color={colors.primaryDark} />
            <Text style={styles.title}> Tu Progreso</Text>
          </View>
          <TouchableOpacity
            style={styles.addWeightBtn}
            onPress={() => setAddWeightModal(true)}
          >
            <PlusCircle size={20} color={colors.text.inverse} />
            <Text style={styles.addWeightText}>Añadir Peso</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Dumbbell size={24} color={colors.primary} style={styles.statIcon} />
            <Text style={styles.statValue}>{stats?.totalWorkouts || 0}</Text>
            <Text style={styles.statLabel}>Entrenamientos</Text>
          </View>

          <View style={styles.statCard}>
            <Activity size={24} color={colors.primary} style={styles.statIcon} />
            <Text style={styles.statValue}>{stats?.totalRepsCompleted || 0}</Text>
            <Text style={styles.statLabel}>Reps totals</Text>
          </View>

          <View style={styles.statCard}>
            <Scale size={24} color={colors.primary} style={styles.statIcon} />
            <Text style={styles.statValue}>{currentWeight ? `${currentWeight}kg` : '-'}</Text>
            <Text style={styles.statLabel}>Peso actual</Text>
          </View>

          <View style={styles.statCard}>
            <TrendingUp size={24} color={weightChange >= 0 ? colors.primary : colors.danger} style={styles.statIcon} />
            <Text style={[
              styles.statValue,
              { color: weightChange >= 0 ? colors.primary : colors.danger }
            ]}>
              {weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}kg` : '-'}
            </Text>
            <Text style={styles.statLabel}>Cambio de peso</Text>
          </View>

          <View style={styles.statCard}>
            <Dumbbell size={24} color={colors.primary} style={styles.statIcon} />
            <Text style={styles.statValue}>{stats?.totalWeightLifted ? `${Math.round(stats.totalWeightLifted)}kg` : '0kg'}</Text>
            <Text style={styles.statLabel}>Peso total levantado</Text>
          </View>
        </View>

        {/* Weight Chart */}
        {weightHistory.length > 0 ? (
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Historial de Peso (30 días)</Text>
            <LineChart
              data={chartData}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundColor: colors.text.inverse,
                backgroundGradientFrom: colors.text.inverse,
                backgroundGradientTo: colors.text.inverse,
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: colors.primary
                }
              }}
              bezier
              style={styles.chart}
            />
          </View>
        ) : (
          <View style={styles.emptyChartContainer}>
            <TrendingUp size={48} color={colors.text.disabled} />
            <Text style={styles.emptyText}>No hay datos de peso</Text>
            <Text style={styles.emptySubtext}>Añade tu primer registro de peso</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => setAddWeightModal(true)}
            >
              <Text style={styles.emptyButtonText}>Añadir peso</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.recentActivityContainer}>
          <Text style={styles.sectionTitle}>Actividad Reciente</Text>
          {recentSessions.length > 0 ? (
            recentSessions.map((session, index) => {
              const date = new Date(session.completed_at);
              const totalVolume = session.exercises_performed?.reduce((sum, ex) => {
                const exerciseVolume = ex.sets_completed?.reduce((setSum, set) => {
                  return setSum + (set.weight || 0) * (set.reps || 0);
                }, 0) || 0;
                return sum + exerciseVolume;
              }, 0) || 0;

              return (
                <View key={session._id || index} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    <CheckCircle size={24} color={colors.primary} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>{session.workout_id?.name || 'Entrenamiento'}</Text>
                    <Text style={styles.activityDate}>
                      {date.toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  <View style={styles.activityStats}>
                    <Text style={styles.activityVolume}>{totalVolume.toFixed(0)}kg</Text>
                    <Text style={styles.activityVolumeLabel}>volumen</Text>
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyActivity}>
              <Dumbbell size={32} color={colors.text.disabled} />
              <Text style={styles.emptyActivityText}>No hay entrenamientos completados</Text>
            </View>
          )}
        </View>

        {/* Weight History List */}
        {weightHistory.length > 0 && (
          <View style={styles.weightListContainer}>
            <Text style={styles.sectionTitle}>Registros de Peso</Text>
            {weightHistory.slice(0, 5).map((entry, index) => {
              const date = new Date(entry.date);
              const prevWeight = index < weightHistory.length - 1 ? weightHistory[index + 1].weight : null;
              const change = prevWeight ? entry.weight - prevWeight : null;

              return (
                <View key={entry._id || index} style={styles.weightItem}>
                  <View style={styles.weightItemLeft}>
                    <Text style={styles.weightItemDate}>
                      {date.toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                  <View style={styles.weightItemRight}>
                    <Text style={styles.weightItemValue}>{entry.weight} kg</Text>
                    {change !== null && (
                      <Text style={[
                        styles.weightItemChange,
                        { color: change >= 0 ? colors.primary : colors.danger }
                      ]}>
                        {change > 0 ? '+' : ''}{change.toFixed(1)}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <AddWeightModal
        visible={addWeightModal}
        onClose={() => {
          setAddWeightModal(false);
          setNewWeight('');
        }}
        weight={newWeight}
        onWeightChange={setNewWeight}
        onSave={handleAddWeight}
        loading={loading}
      />

      {/* System Modals */}
      <ErrorModal
        visible={errorModal.visible}
        title={errorModal.modalData.title}
        message={errorModal.modalData.message}
        icon={errorModal.modalData.icon}
        onClose={errorModal.closeModal}
      />

      <InfoModal
        visible={infoModal.visible}
        title={infoModal.modalData.title}
        message={infoModal.modalData.message}
        icon={infoModal.modalData.icon}
        onClose={infoModal.closeModal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.main,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.text.secondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primaryDark,
  },
  addWeightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  addWeightText: {
    color: colors.text.inverse,
    fontWeight: '600',
    fontSize: 14,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: 'white',
    width: '48%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  chartContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 15,
  },
  chart: {
    borderRadius: 10,
    marginVertical: 8,
  },
  emptyChartContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 40,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.secondary,
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recentActivityContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityIcon: {
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  activityDate: {
    fontSize: 13,
    color: '#999',
  },
  activityStats: {
    alignItems: 'flex-end',
  },
  activityVolume: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  activityVolumeLabel: {
    fontSize: 11,
    color: '#999',
  },
  emptyActivity: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyActivityText: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
  weightListContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  weightItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  weightItemLeft: {
    flex: 1,
  },
  weightItemDate: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  weightItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  weightItemValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  weightItemChange: {
    fontSize: 14,
    fontWeight: '600',
  },
});

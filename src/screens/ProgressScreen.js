import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { LineChart } from 'react-native-chart-kit';
import {
  getWeightHistory,
  addWeightEntry,
  getUserStats,
  getWorkoutSessions,
  analyzeProgress
} from '../services/api';

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
  const [aiAnalysisModal, setAiAnalysisModal] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analyzingProgress, setAnalyzingProgress] = useState(false);

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
      console.error('Error loading progress data:', error);
      Alert.alert('Error', 'No se pudo cargar el progreso');
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
      Alert.alert('Error', 'Por favor ingresa un peso válido');
      return;
    }

    try {
      setLoading(true);
      await addWeightEntry(weight);
      await loadProgressData();
      setAddWeightModal(false);
      setNewWeight('');
      Alert.alert('Éxito', 'Peso registrado correctamente');
    } catch (error) {
      console.error('Error adding weight:', error);
      Alert.alert('Error', error.message || 'No se pudo registrar el peso');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyzeProgress = async () => {
    try {
      setAnalyzingProgress(true);
      const analysis = await analyzeProgress();
      setAiAnalysis(analysis);
      setAiAnalysisModal(true);
    } catch (error) {
      console.error('Error analyzing progress:', error);
      Alert.alert('Error', error.message || 'No se pudo analizar el progreso');
    } finally {
      setAnalyzingProgress(false);
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
          <ActivityIndicator size="large" color="#4CAF50" />
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
          <Text style={styles.title}>📈 Tu Progreso</Text>
          <TouchableOpacity
            style={styles.addWeightBtn}
            onPress={() => setAddWeightModal(true)}
          >
            <Icon name="add-circle" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Icon name="barbell" size={24} color="#4CAF50" style={styles.statIcon} />
            <Text style={styles.statValue}>{stats?.total_workouts || 0}</Text>
            <Text style={styles.statLabel}>Entrenamientos</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="calendar" size={24} color="#4CAF50" style={styles.statIcon} />
            <Text style={styles.statValue}>{stats?.weeks_active || 0}</Text>
            <Text style={styles.statLabel}>Semanas activas</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="fitness" size={24} color="#4CAF50" style={styles.statIcon} />
            <Text style={styles.statValue}>{currentWeight ? `${currentWeight}kg` : '-'}</Text>
            <Text style={styles.statLabel}>Peso actual</Text>
          </View>

          <View style={styles.statCard}>
            <Icon name="trending-up" size={24} color={weightChange >= 0 ? '#4CAF50' : '#f44336'} style={styles.statIcon} />
            <Text style={[
              styles.statValue,
              { color: weightChange >= 0 ? '#4CAF50' : '#f44336' }
            ]}>
              {weightChange !== null ? `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)}kg` : '-'}
            </Text>
            <Text style={styles.statLabel}>Cambio de peso</Text>
          </View>
        </View>

        {/* AI Analysis Card */}
        <TouchableOpacity
          style={styles.aiAnalysisCard}
          onPress={handleAnalyzeProgress}
          disabled={analyzingProgress}
        >
          <View style={styles.aiAnalysisLeft}>
            <Icon name="sparkles" size={32} color="#FF9800" />
            <View style={styles.aiAnalysisTextContainer}>
              <Text style={styles.aiAnalysisTitle}>Análisis con IA</Text>
              <Text style={styles.aiAnalysisDesc}>
                Obtén insights personalizados sobre tu progreso
              </Text>
            </View>
          </View>
          {analyzingProgress ? (
            <ActivityIndicator color="#FF9800" />
          ) : (
            <Icon name="arrow-forward-circle" size={28} color="#FF9800" />
          )}
        </TouchableOpacity>

        {/* Weight Chart */}
        {weightHistory.length > 0 ? (
          <View style={styles.chartContainer}>
            <Text style={styles.sectionTitle}>Historial de Peso (30 días)</Text>
            <LineChart
              data={chartData}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: '#4CAF50'
                }
              }}
              bezier
              style={styles.chart}
            />
          </View>
        ) : (
          <View style={styles.emptyChartContainer}>
            <Icon name="stats-chart-outline" size={48} color="#ccc" />
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
                    <Icon name="checkmark-circle" size={24} color="#4CAF50" />
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
              <Icon name="barbell-outline" size={32} color="#ccc" />
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
                        { color: change >= 0 ? '#4CAF50' : '#f44336' }
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

      {/* Add Weight Modal */}
      <Modal
        visible={addWeightModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddWeightModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Registrar Peso</Text>
              <TouchableOpacity onPress={() => setAddWeightModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalLabel}>Peso actual (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 75.5"
              keyboardType="decimal-pad"
              value={newWeight}
              onChangeText={setNewWeight}
              autoFocus
            />

            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={handleAddWeight}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.modalSaveBtnText}>Guardar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* AI Analysis Modal */}
      <Modal
        visible={aiAnalysisModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAiAnalysisModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <View style={styles.aiModalHeader}>
                <Icon name="sparkles" size={24} color="#FF9800" />
                <Text style={styles.modalTitle}>Análisis de Progreso</Text>
              </View>
              <TouchableOpacity onPress={() => setAiAnalysisModal(false)}>
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.aiAnalysisContent} showsVerticalScrollIndicator={false}>
              {aiAnalysis ? (
                <>
                  <View style={styles.aiSection}>
                    <Text style={styles.aiSectionTitle}>📊 Resumen</Text>
                    <Text style={styles.aiText}>{aiAnalysis.analysis || 'Análisis no disponible'}</Text>
                  </View>

                  {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                    <View style={styles.aiSection}>
                      <Text style={styles.aiSectionTitle}>💡 Recomendaciones</Text>
                      {aiAnalysis.recommendations.map((rec, index) => (
                        <View key={index} style={styles.recommendationItem}>
                          <Icon name="checkmark-circle" size={16} color="#4CAF50" />
                          <Text style={styles.recommendationText}>{rec}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {aiAnalysis.insights && (
                    <View style={styles.aiSection}>
                      <Text style={styles.aiSectionTitle}>✨ Insights</Text>
                      <Text style={styles.aiText}>{aiAnalysis.insights}</Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.aiEmptyState}>
                  <Icon name="analytics-outline" size={64} color="#ccc" />
                  <Text style={styles.aiEmptyText}>No hay análisis disponible</Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalSaveBtn}
              onPress={() => setAiAnalysisModal(false)}
            >
              <Text style={styles.modalSaveBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  addWeightBtn: {
    padding: 5,
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
    color: '#2D5016',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
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
    color: '#2D5016',
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
    color: '#666',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#4CAF50',
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
    color: '#4CAF50',
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
    color: '#666',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  modalLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  modalSaveBtn: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  modalSaveBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  aiAnalysisCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
  },
  aiAnalysisLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 15,
  },
  aiAnalysisTextContainer: {
    flex: 1,
  },
  aiAnalysisTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 4,
  },
  aiAnalysisDesc: {
    fontSize: 13,
    color: '#666',
  },
  aiModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiAnalysisContent: {
    padding: 20,
  },
  aiSection: {
    marginBottom: 20,
  },
  aiSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 10,
  },
  aiText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  aiEmptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  aiEmptyText: {
    fontSize: 14,
    color: '#999',
    marginTop: 15,
  },
});

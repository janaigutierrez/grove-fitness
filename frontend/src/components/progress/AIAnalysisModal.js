import React from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';

export default function AIAnalysisModal({
  visible,
  onClose,
  analysis,
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: '80%' }]}>
          <View style={styles.modalHeader}>
            <View style={styles.aiModalHeader}>
              <Icon name="sparkles" size={24} color="#FF9800" />
              <Text style={styles.modalTitle}>Análisis de Progreso</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.aiAnalysisContent} showsVerticalScrollIndicator={false}>
            {analysis ? (
              <>
                <View style={styles.aiSection}>
                  <Text style={styles.aiSectionTitle}>📊 Resumen</Text>
                  <Text style={styles.aiText}>{analysis.analysis || 'Análisis no disponible'}</Text>
                </View>

                {analysis.recommendations && analysis.recommendations.length > 0 && (
                  <View style={styles.aiSection}>
                    <Text style={styles.aiSectionTitle}>💡 Recomendaciones</Text>
                    {analysis.recommendations.map((rec, index) => (
                      <View key={index} style={styles.recommendationItem}>
                        <Icon name="checkmark-circle" size={16} color="#4CAF50" />
                        <Text style={styles.recommendationText}>{rec}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {analysis.insights && (
                  <View style={styles.aiSection}>
                    <Text style={styles.aiSectionTitle}>✨ Insights</Text>
                    <Text style={styles.aiText}>{analysis.insights}</Text>
                  </View>
                )}
              </>
            ) : (
              <EmptyState
                icon="analytics-outline"
                title="No hay análisis disponible"
                message=""
              />
            )}
          </ScrollView>

          <Button
            text="Cerrar"
            onPress={onClose}
            fullWidth
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  aiModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  aiAnalysisContent: {
    maxHeight: 400,
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
    color: '#666',
    lineHeight: 22,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    lineHeight: 20,
  },
});

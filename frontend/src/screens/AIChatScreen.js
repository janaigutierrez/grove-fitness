import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { chatWithAI, executeAIAction, getCurrentUser, changeAIPersonality } from '../services/api';
import { handleApiError, formatSuccessMessage } from '../utils/errorHandler';
import ErrorModal from '../components/common/ErrorModal';
import InfoModal from '../components/common/InfoModal';
import useModal from '../hooks/useModal';
import colors from '../constants/colors';

export default function AIChatScreen() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [personalityModalVisible, setPersonalityModalVisible] = useState(false);
  const [changingPersonality, setChangingPersonality] = useState(false);
  const scrollViewRef = useRef();

  const errorModal = useModal();
  const infoModal = useModal();

  useEffect(() => {
    setMessages([
      {
        id: 1,
        role: 'assistant',
        content: 'Hola! Sóc el teu entrenador IA. En què et puc ajudar avui? Puc crear entrenaments, actualitzar el teu planning setmanal, registrar el teu pes i molt més.',
        timestamp: new Date()
      }
    ]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUser();
    }, [])
  );

  const loadUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await chatWithAI(inputText.trim());

      const newMessages = [];

      if (response.response) {
        newMessages.push({
          id: Date.now() + 1,
          role: 'assistant',
          content: response.response,
          timestamp: new Date()
        });
      }

      if (response.pending_action) {
        newMessages.push({
          id: Date.now() + 2,
          role: 'action',
          pending_action: response.pending_action,
          actionStatus: 'pending',
          timestamp: new Date()
        });
      }

      setMessages(prev => [...prev, ...newMessages]);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      const errorInfo = handleApiError(error);
      errorModal.openModal({
        title: errorInfo.title,
        message: errorInfo.message || 'No s\'ha pogut enviar el missatge',
        icon: errorInfo.icon,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async (messageId, action) => {
    setMessages(prev => prev.map(m =>
      m.id === messageId ? { ...m, actionStatus: 'executing' } : m
    ));

    try {
      const result = await executeAIAction(action);

      setMessages(prev => [
        ...prev.map(m => m.id === messageId ? { ...m, actionStatus: 'confirmed' } : m),
        {
          id: Date.now(),
          role: 'assistant',
          content: `✅ ${result.message}`,
          timestamp: new Date()
        }
      ]);

      // Refresh user data in case profile/weight changed
      loadUser();

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      setMessages(prev => prev.map(m =>
        m.id === messageId ? { ...m, actionStatus: 'pending' } : m
      ));
      const errorInfo = handleApiError(error);
      errorModal.openModal({
        title: 'Error executant l\'acció',
        message: errorInfo.message || 'No s\'ha pogut executar l\'acció',
        icon: errorInfo.icon,
      });
    }
  };

  const handleCancelAction = (messageId) => {
    setMessages(prev => [
      ...prev.map(m => m.id === messageId ? { ...m, actionStatus: 'cancelled' } : m),
      {
        id: Date.now(),
        role: 'assistant',
        content: 'D\'acord, he cancel·lat l\'acció. Pots demanar-me qualsevol altra cosa.',
        timestamp: new Date()
      }
    ]);
  };

  const handleChangePersonality = async (personalityType) => {
    try {
      setChangingPersonality(true);
      await changeAIPersonality(personalityType);
      setUser({ ...user, personality_type: personalityType });
      setPersonalityModalVisible(false);

      const successInfo = formatSuccessMessage(`El teu entrenador IA ara té personalitat ${personalityType}`, 'success');
      infoModal.openModal({
        title: 'Personalitat actualitzada',
        message: successInfo.message,
        icon: successInfo.icon,
        onClose: infoModal.closeModal,
      });
    } catch (error) {
      const errorInfo = handleApiError(error);
      errorModal.openModal({
        title: 'Error',
        message: errorInfo.message || 'No s\'ha pogut canviar la personalitat',
        icon: errorInfo.icon,
      });
    } finally {
      setChangingPersonality(false);
    }
  };

  const getPersonalityIcon = () => {
    const personality = user?.personality_type || 'motivador';
    switch (personality) {
      case 'motivador': return 'flame';
      case 'analitico': return 'analytics';
      case 'bestia': return 'fitness';
      case 'relajado': return 'leaf';
      default: return 'chatbubble';
    }
  };

  const getPersonalityColor = () => {
    const personality = user?.personality_type || 'motivador';
    switch (personality) {
      case 'motivador': return '#ff6b6b';
      case 'analitico': return '#4A90E2';
      case 'bestia': return colors.primaryDark;
      case 'relajado': return colors.primary;
      default: return colors.primary;
    }
  };

  const stripMarkdown = (text) => {
    if (!text) return text;
    return text
      .replace(/\*\*(.+?)\*\*/gs, '$1')
      .replace(/\*(.+?)\*/gs, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/`{3}[\s\S]*?`{3}/g, '')
      .replace(/`(.+?)`/g, '$1')
      .replace(/\[(.+?)\]\(.+?\)/g, '$1')
      .replace(/^>\s+/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '• ')
      .trim();
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const getActionMeta = (action) => {
    switch (action.type) {
      case 'create_workout':
        return {
          icon: 'barbell',
          title: 'Crear Entrenament',
          color: '#4CAF50',
          summary: [
            `Nom: ${action.data.name}`,
            `Tipus: ${action.data.workout_type} · Dificultat: ${action.data.difficulty}`,
            `${action.data.exercises?.length || 0} exercicis · ${action.data.estimated_duration_minutes || '?'} min`,
          ].join('\n')
        };
      case 'update_schedule': {
        const DAY_NAMES = { monday: 'Dilluns', tuesday: 'Dimarts', wednesday: 'Dimecres', thursday: 'Dijous', friday: 'Divendres', saturday: 'Dissabte', sunday: 'Diumenge' };
        const lines = Object.entries(action.data)
          .map(([day, val]) => `${DAY_NAMES[day] || day}: ${val ? 'Entrenament assignat' : 'Descans'}`);
        return {
          icon: 'calendar',
          title: 'Actualitzar Planning Setmanal',
          color: '#4A90E2',
          summary: lines.join('\n')
        };
      }
      case 'update_profile': {
        const LABELS = { weight: 'Pes', height: 'Alçada', age: 'Edat' };
        const UNITS = { weight: ' kg', height: ' cm', age: ' anys' };
        const lines = Object.entries(action.data)
          .map(([k, v]) => `${LABELS[k] || k}: ${v}${UNITS[k] || ''}`);
        return {
          icon: 'person',
          title: 'Actualitzar Dades Personals',
          color: '#ff9800',
          summary: lines.join('\n')
        };
      }
      case 'log_weight':
        return {
          icon: 'scale',
          title: 'Registrar Pes',
          color: '#9c27b0',
          summary: `Pes: ${action.data.weight} kg`
        };
      default:
        return { icon: 'flash', title: 'Acció', color: '#666', summary: '' };
    }
  };

  const renderActionCard = (message) => {
    const { pending_action, actionStatus, id } = message;
    const meta = getActionMeta(pending_action);
    const isExecuting = actionStatus === 'executing';

    return (
      <View key={id} style={styles.actionCardWrapper}>
        <View style={[styles.actionCard, { borderLeftColor: meta.color }]}>
          <View style={styles.actionCardHeader}>
            <View style={[styles.actionCardIcon, { backgroundColor: meta.color + '22' }]}>
              <Icon name={meta.icon} size={18} color={meta.color} />
            </View>
            <Text style={[styles.actionCardTitle, { color: meta.color }]}>{meta.title}</Text>
          </View>

          <Text style={styles.actionCardSummary}>{meta.summary}</Text>

          {actionStatus === 'pending' && (
            <View style={styles.actionCardButtons}>
              <TouchableOpacity
                style={[styles.actionConfirmBtn, { backgroundColor: meta.color }]}
                onPress={() => handleConfirmAction(id, pending_action)}
              >
                <Icon name="checkmark" size={16} color="white" />
                <Text style={styles.actionConfirmText}>Confirmar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionCancelBtn}
                onPress={() => handleCancelAction(id)}
              >
                <Icon name="close" size={16} color="#666" />
                <Text style={styles.actionCancelText}>Cancel·lar</Text>
              </TouchableOpacity>
            </View>
          )}

          {isExecuting && (
            <View style={styles.actionExecuting}>
              <ActivityIndicator size="small" color={meta.color} />
              <Text style={[styles.actionExecutingText, { color: meta.color }]}>Executant...</Text>
            </View>
          )}

          {actionStatus === 'confirmed' && (
            <View style={styles.actionStatusRow}>
              <Icon name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.actionStatusConfirmed}>Executat correctament</Text>
            </View>
          )}

          {actionStatus === 'cancelled' && (
            <View style={styles.actionStatusRow}>
              <Icon name="close-circle" size={16} color="#999" />
              <Text style={styles.actionStatusCancelled}>Cancel·lat</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderMessage = (message) => {
    if (message.role === 'action') {
      return renderActionCard(message);
    }

    const isUser = message.role === 'user';

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer
        ]}
      >
        {!isUser && (
          <View style={[styles.aiAvatar, { backgroundColor: getPersonalityColor() }]}>
            <Icon name={getPersonalityIcon()} size={20} color="white" />
          </View>
        )}

        <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
            {isUser ? message.content : stripMarkdown(message.content)}
          </Text>
          <Text style={[styles.messageTime, isUser ? styles.userTime : styles.aiTime]}>
            {formatTime(message.timestamp)}
          </Text>
        </View>

        {isUser && (
          <View style={styles.userAvatar}>
            <Icon name="person" size={20} color="white" />
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.main }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerAvatar, { backgroundColor: getPersonalityColor() }]}>
              <Icon name={getPersonalityIcon()} size={24} color="white" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Entrenador IA</Text>
              <Text style={styles.headerSubtitle}>
                Mode: {user?.personality_type || 'Motivador'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setPersonalityModalVisible(true)}
            style={styles.settingsButton}
          >
            <Icon name="settings-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(renderMessage)}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={getPersonalityColor()} />
              <Text style={styles.loadingText}>Pensant...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escriu el teu missatge..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!loading}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() ? getPersonalityColor() : colors.text.disabled }
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || loading}
          >
            <Icon name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Personality Selector Modal */}
        <Modal
          visible={personalityModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setPersonalityModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Personalitat de l'Entrenador</Text>
                <TouchableOpacity onPress={() => setPersonalityModalVisible(false)}>
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.personalitiesContainer}>
                <Text style={styles.modalDescription}>
                  Tria com vols que sigui el teu entrenador IA
                </Text>

                {[
                  { key: 'motivador', icon: 'flame', color: '#ff6b6b', name: 'Motivador', desc: 'Energètic i ple d\'ànim. T\'impulsa a superar-te cada dia.' },
                  { key: 'analitico', icon: 'analytics', color: '#4A90E2', name: 'Analític', desc: 'Basat en dades i ciència. Et dóna informació precisa i detallada.' },
                  { key: 'bestia', icon: 'fitness', color: colors.primaryDark, name: 'Bèstia', desc: 'Intens i sense excuses. Et repte a donar el màxim rendiment.' },
                  { key: 'relajado', icon: 'leaf', color: colors.primary, name: 'Relaxat', desc: 'Amigable i comprensiu. Et dóna suport amb paciència i calma.' },
                ].map(p => (
                  <TouchableOpacity
                    key={p.key}
                    style={[
                      styles.personalityCard,
                      user?.personality_type === p.key && styles.personalityCardActive
                    ]}
                    onPress={() => handleChangePersonality(p.key)}
                    disabled={changingPersonality}
                  >
                    <View style={[styles.personalityIcon, { backgroundColor: p.color }]}>
                      <Icon name={p.icon} size={28} color="white" />
                    </View>
                    <View style={styles.personalityInfo}>
                      <Text style={styles.personalityName}>{p.name}</Text>
                      <Text style={styles.personalityDesc}>{p.desc}</Text>
                    </View>
                    {user?.personality_type === p.key && (
                      <Icon name="checkmark-circle" size={24} color="#4CAF50" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {changingPersonality && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#4CAF50" />
                  <Text style={styles.loadingOverlayText}>Actualitzant personalitat...</Text>
                </View>
              )}
            </View>
          </View>
        </Modal>

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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: colors.text.inverse,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primaryDark,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: colors.background.lightCream,
  },
  messagesContent: {
    padding: 15,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: colors.background.cream,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.background.beige,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: colors.text.inverse,
  },
  aiText: {
    color: colors.text.primary,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  userTime: {
    color: colors.overlay.white30,
    textAlign: 'right',
  },
  aiTime: {
    color: colors.text.tertiary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: colors.background.cream,
    borderTopWidth: 1,
    borderTopColor: colors.background.beige,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: colors.text.inverse,
    borderWidth: 1,
    borderColor: colors.background.beige,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: 10,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    padding: 8,
  },
  // Action card styles
  actionCardWrapper: {
    marginBottom: 15,
    paddingLeft: 40,
  },
  actionCard: {
    backgroundColor: colors.text.inverse,
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionCardIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  actionCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  actionCardSummary: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  actionCardButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionConfirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  actionConfirmText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionCancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#ddd',
    gap: 6,
  },
  actionCancelText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  actionExecuting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  actionExecutingText: {
    fontSize: 13,
    fontWeight: '600',
  },
  actionStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  actionStatusConfirmed: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
  },
  actionStatusCancelled: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },
  // Personality modal
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.background.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.text.inverse,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primaryDark,
  },
  modalDescription: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 20,
  },
  personalitiesContainer: {
    padding: 20,
  },
  personalityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.main,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  personalityCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#e8f5e9',
  },
  personalityIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  personalityInfo: {
    flex: 1,
  },
  personalityName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primaryDark,
    marginBottom: 4,
  },
  personalityDesc: {
    fontSize: 13,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  loadingOverlayText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.text.secondary,
  },
});

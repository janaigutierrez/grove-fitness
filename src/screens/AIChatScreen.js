import React, { useState, useRef, useEffect } from 'react';
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
import { chatWithAI, getCurrentUser, changeAIPersonality } from '../services/api';
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

  // System modals
  const errorModal = useModal();
  const infoModal = useModal();

  useEffect(() => {
    loadUser();
    // Mensaje de bienvenida
    setMessages([
      {
        id: 1,
        role: 'assistant',
        content: '¡Hola! Soy tu entrenador IA. ¿En qué puedo ayudarte hoy? Puedo ayudarte con rutinas, consejos de entrenamiento, nutrición, y mucho más.',
        timestamp: new Date()
      }
    ]);
  }, []);

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

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Auto-scroll al final
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      const errorInfo = handleApiError(error);
      errorModal.openModal({
        title: errorInfo.title,
        message: errorInfo.message || 'No se pudo enviar el mensaje',
        icon: errorInfo.icon,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePersonality = async (personalityType) => {
    try {
      setChangingPersonality(true);
      await changeAIPersonality(personalityType);

      // Actualizar el usuario local
      setUser({ ...user, ai_personality_type: personalityType });
      setPersonalityModalVisible(false);

      const successInfo = formatSuccessMessage(`Tu entrenador IA ahora tiene personalidad ${personalityType}`, 'success');
      infoModal.openModal({
        title: 'Personalidad actualizada',
        message: successInfo.message,
        icon: successInfo.icon,
        onClose: infoModal.closeModal,
      });

      // Recargar usuario para asegurar que esté sincronizado
      await loadUser();
    } catch (error) {
      const errorInfo = handleApiError(error);
      errorModal.openModal({
        title: 'Error',
        message: errorInfo.message || 'No se pudo cambiar la personalidad',
        icon: errorInfo.icon,
      });
    } finally {
      setChangingPersonality(false);
    }
  };

  const getPersonalityIcon = () => {
    const personality = user?.ai_personality_type || 'motivador';
    switch (personality) {
      case 'motivador':
        return 'flame';
      case 'analitico':
        return 'analytics';
      case 'bestia':
        return 'fitness';
      case 'relajado':
        return 'leaf';
      default:
        return 'chatbubble';
    }
  };

  const getPersonalityColor = () => {
    const personality = user?.ai_personality_type || 'motivador';
    switch (personality) {
      case 'motivador':
        return '#ff6b6b';
      case 'analitico':
        return '#4A90E2';
      case 'bestia':
        return colors.primaryDark;
      case 'relajado':
        return colors.primary;
      default:
        return colors.primary;
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderMessage = (message) => {
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

        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble
          ]}
        >
          <Text style={[
            styles.messageText,
            isUser ? styles.userText : styles.aiText
          ]}>
            {message.content}
          </Text>
          <Text style={[
            styles.messageTime,
            isUser ? styles.userTime : styles.aiTime
          ]}>
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
                Modo: {user?.ai_personality_type || 'Motivador'}
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
              <Text style={styles.loadingText}>Pensando...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escribe tu mensaje..."
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
                <Text style={styles.modalTitle}>Personalidad del Entrenador</Text>
                <TouchableOpacity onPress={() => setPersonalityModalVisible(false)}>
                  <Icon name="close" size={24} color="#666" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.personalitiesContainer}>
                <Text style={styles.modalDescription}>
                  Elige cómo quieres que sea tu entrenador IA
                </Text>

                {/* Motivador */}
                <TouchableOpacity
                  style={[
                    styles.personalityCard,
                    user?.ai_personality_type === 'motivador' && styles.personalityCardActive
                  ]}
                  onPress={() => handleChangePersonality('motivador')}
                  disabled={changingPersonality}
                >
                  <View style={[styles.personalityIcon, { backgroundColor: '#ff6b6b' }]}>
                    <Icon name="flame" size={28} color="white" />
                  </View>
                  <View style={styles.personalityInfo}>
                    <Text style={styles.personalityName}>Motivador</Text>
                    <Text style={styles.personalityDesc}>
                      Energético y lleno de ánimo. Te impulsa a superarte cada día.
                    </Text>
                  </View>
                  {user?.ai_personality_type === 'motivador' && (
                    <Icon name="checkmark-circle" size={24} color="#4CAF50" />
                  )}
                </TouchableOpacity>

                {/* Analítico */}
                <TouchableOpacity
                  style={[
                    styles.personalityCard,
                    user?.ai_personality_type === 'analitico' && styles.personalityCardActive
                  ]}
                  onPress={() => handleChangePersonality('analitico')}
                  disabled={changingPersonality}
                >
                  <View style={[styles.personalityIcon, { backgroundColor: '#4A90E2' }]}>
                    <Icon name="analytics" size={28} color="white" />
                  </View>
                  <View style={styles.personalityInfo}>
                    <Text style={styles.personalityName}>Analítico</Text>
                    <Text style={styles.personalityDesc}>
                      Basado en datos y ciencia. Te da información precisa y detallada.
                    </Text>
                  </View>
                  {user?.ai_personality_type === 'analitico' && (
                    <Icon name="checkmark-circle" size={24} color="#4CAF50" />
                  )}
                </TouchableOpacity>

                {/* Bestia */}
                <TouchableOpacity
                  style={[
                    styles.personalityCard,
                    user?.ai_personality_type === 'bestia' && styles.personalityCardActive
                  ]}
                  onPress={() => handleChangePersonality('bestia')}
                  disabled={changingPersonality}
                >
                  <View style={[styles.personalityIcon, { backgroundColor: colors.primaryDark }]}>
                    <Icon name="fitness" size={28} color="white" />
                  </View>
                  <View style={styles.personalityInfo}>
                    <Text style={styles.personalityName}>Bestia</Text>
                    <Text style={styles.personalityDesc}>
                      Intenso y sin excusas. Te reta a dar el máximo rendimiento.
                    </Text>
                  </View>
                  {user?.ai_personality_type === 'bestia' && (
                    <Icon name="checkmark-circle" size={24} color="#4CAF50" />
                  )}
                </TouchableOpacity>

                {/* Relajado */}
                <TouchableOpacity
                  style={[
                    styles.personalityCard,
                    user?.ai_personality_type === 'relajado' && styles.personalityCardActive
                  ]}
                  onPress={() => handleChangePersonality('relajado')}
                  disabled={changingPersonality}
                >
                  <View style={[styles.personalityIcon, { backgroundColor: colors.primary }]}>
                    <Icon name="leaf" size={28} color="white" />
                  </View>
                  <View style={styles.personalityInfo}>
                    <Text style={styles.personalityName}>Relajado</Text>
                    <Text style={styles.personalityDesc}>
                      Amigable y comprensivo. Te apoya con paciencia y calma.
                    </Text>
                  </View>
                  {user?.ai_personality_type === 'relajado' && (
                    <Icon name="checkmark-circle" size={24} color="#4CAF50" />
                  )}
                </TouchableOpacity>
              </ScrollView>

              {changingPersonality && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#4CAF50" />
                  <Text style={styles.loadingText}>Actualizando personalidad...</Text>
                </View>
              )}
            </View>
          </View>
        </Modal>

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
    backgroundColor: colors.background.main,
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
    backgroundColor: colors.text.inverse,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
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
    backgroundColor: colors.text.inverse,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: colors.background.main,
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
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: colors.text.secondary,
  },
});

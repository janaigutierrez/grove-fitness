import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { chatWithAI, getCurrentUser } from '../services/api';

export default function AIChatScreen() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const scrollViewRef = useRef();

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
      console.error('Error loading user:', error);
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
      console.error('Error sending message:', error);
      Alert.alert('Error', error.message || 'No se pudo enviar el mensaje');
    } finally {
      setLoading(false);
    }
  };

  const getPersonalityIcon = () => {
    const personality = user?.ai_personality_type || 'motivador';
    switch (personality) {
      case 'motivador':
        return 'flame';
      case 'analítico':
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
      case 'analítico':
        return '#4A90E2';
      case 'bestia':
        return '#2D5016';
      case 'relajado':
        return '#4CAF50';
      default:
        return '#4CAF50';
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f5f5f5' }}>
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
              { backgroundColor: inputText.trim() ? getPersonalityColor() : '#ccc' }
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || loading}
          >
            <Icon name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
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
    backgroundColor: 'white',
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
    color: '#2D5016',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    backgroundColor: '#2D5016',
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
    backgroundColor: '#4CAF50',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: 'white',
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
    color: 'white',
  },
  aiText: {
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  userTime: {
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'right',
  },
  aiTime: {
    color: '#999',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
});

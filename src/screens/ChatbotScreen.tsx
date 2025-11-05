// src/screens/ChatbotScreen.tsx
import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  Keyboard,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AwesomeAlert from 'react-native-awesome-alerts';
import {SafeLayout} from '../components/SafeLayout';
import {Header} from '../components/Header';
import {useNavigation} from '@react-navigation/native';
import api from '../services/api';

interface Message {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

interface EventSuggestion {
  title: string;
  description: string;
}

export default function ChatbotScreen() {
  const navigation = useNavigation();
  const scrollViewRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'bot',
      text: 'Olá! Vou te ajudar a criar um título e descrição incríveis para seu evento. Para começar, me conte: que tipo de evento você quer criar? 🎉',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<EventSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [conversationComplete, setConversationComplete] = useState(false);

  // Estados do alert
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        // Quando o teclado abrir, faz scroll para o final após um pequeno delay
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({animated: true});
        }, 100);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  useEffect(() => {
    // Scroll automático para o final quando novas mensagens chegam
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({animated: true});
    }, 100);
  }, [messages]);

  const showAlert = (title: string, message: string) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleGoBack = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      // Reseta a conversa antes de voltar
      await api.post('/chatbot/reset-conversation', {}, {
        headers: {Authorization: `Bearer ${token}`},
      });
    } catch (error) {
      console.log('Erro ao resetar conversa:', error);
    }
    (navigation as any).navigate('CreateEvent');
  };

  const sendMessage = async () => {
    if (!inputText.trim()) {
      return;
    }

    const userMessage = inputText.trim();
    setInputText('');

    // Adiciona mensagem do usuário
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userMessage,
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        showAlert('Sessão Expirada', 'Por favor, faça login novamente.');
        return;
      }

      const response = await api.post(
        '/chatbot/generate-event',
        {message: userMessage},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = response.data;

      if (data.conversationComplete) {
        // Conversa completa, mostrar sugestões
        setConversationComplete(true);
        setSuggestions(data.suggestions);
        setShowSuggestions(true);

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          text: '🎊 Perfeito! Criei 3 sugestões incríveis para você. Escolha a que mais gostar ou refaça a conversa para criar novas sugestões!',
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        // Continua a conversa
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          text: data.message,
        };
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);

      let errorMessage = 'Erro ao processar sua mensagem. Tente novamente.';

      if (error.response) {
        if (error.response.status === 429) {
          errorMessage = error.response.data.message || 'Você atingiu o limite de requisições. Aguarde alguns minutos.';
        } else if (error.response.status === 401 || error.response.status === 403) {
          return;
        } else {
          errorMessage = error.response.data.message || errorMessage;
        }
      }

      showAlert('Erro', errorMessage);

      // Remove a última mensagem do usuário em caso de erro
      setMessages(prev => prev.slice(0, -1));
      setInputText(userMessage); // Restaura o texto
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: EventSuggestion) => {
    // Volta para a tela de criação com os dados preenchidos
    (navigation as any).navigate('CreateEvent', {
      title: suggestion.title,
      description: suggestion.description,
    });
  };

  const handleRestart = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');

      await api.post('/chatbot/reset-conversation', {}, {
        headers: {Authorization: `Bearer ${token}`},
      });

      // Reseta o estado local
      setMessages([
        {
          id: Date.now().toString(),
          role: 'bot',
          text: 'Vamos começar de novo! Que tipo de evento você quer criar? 🎉',
        },
      ]);
      setSuggestions([]);
      setShowSuggestions(false);
      setConversationComplete(false);
      setInputText('');
    } catch (error) {
      console.error('Erro ao resetar conversa:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMessage = (message: Message) => {
    const isBot = message.role === 'bot';

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isBot ? styles.botMessageContainer : styles.userMessageContainer,
        ]}>
        <View
          style={[
            styles.messageBubble,
            isBot ? styles.botBubble : styles.userBubble,
          ]}>
          <Text
            style={[
              styles.messageText,
              isBot ? styles.botText : styles.userText,
            ]}>
            {message.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeLayout showTabBar={false}>
      <Header
        title="Assistente IA"
        isLogged={true}
        userRole="ADMIN"
        navigation={navigation}
        showBackButton={true}
        onBackPress={handleGoBack}
      />

      <View style={[styles.container, {paddingBottom: keyboardHeight}]}>
        {/* Área de mensagens */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesArea}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive">
          {messages.map(renderMessage)}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2563EB" />
              <Text style={styles.loadingText}>IA está pensando...</Text>
            </View>
          )}
        </ScrollView>

        {/* Área de input */}
        {!conversationComplete && (
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Digite sua resposta..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={500}
              editable={!loading}
            />
            <Pressable
              style={[styles.sendButton, loading && styles.sendButtonDisabled]}
              onPress={sendMessage}
              disabled={loading || !inputText.trim()}>
              <Text style={styles.sendButtonText}>➤</Text>
            </Pressable>
          </View>
        )}

        {/* Botão de reiniciar */}
        {conversationComplete && (
          <View style={styles.restartContainer}>
            <Pressable style={styles.restartButton} onPress={handleRestart}>
              <Text style={styles.restartButtonText}>🔄 Criar Novas Sugestões</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Modal de Sugestões */}
      <Modal
        visible={showSuggestions}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSuggestions(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Escolha uma sugestão</Text>

            <ScrollView style={styles.suggestionsScroll}>
              {suggestions.map((suggestion, index) => (
                <Pressable
                  key={index}
                  style={styles.suggestionCard}
                  onPress={() => handleSelectSuggestion(suggestion)}>
                  <View style={styles.suggestionHeader}>
                    <Text style={styles.suggestionNumber}>Opção {index + 1}</Text>
                  </View>
                  <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                  <Text style={styles.suggestionDescription}>
                    {suggestion.description}
                  </Text>
                  <View style={styles.selectButtonContainer}>
                    <Text style={styles.selectButtonText}>Gostei desta</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>

            <Pressable
              style={styles.closeModalButton}
              onPress={() => setShowSuggestions(false)}>
              <Text style={styles.closeModalButtonText}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Alert */}
      <AwesomeAlert
        show={alertVisible}
        showProgress={false}
        title={alertTitle}
        message={alertMessage}
        closeOnTouchOutside
        closeOnHardwareBackPress
        showConfirmButton
        confirmText="OK"
        confirmButtonColor="#F44336"
        onConfirmPressed={() => setAlertVisible(false)}
      />
    </SafeLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  messagesArea: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  botMessageContainer: {
    justifyContent: 'flex-start',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  botBubble: {
    backgroundColor: '#E5E7EB',
    borderBottomLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  botText: {
    color: '#1F2937',
  },
  userText: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: '#6B7280',
    fontSize: 14,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 15,
    color: '#1F2937',
    includeFontPadding: false,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  restartContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  restartButton: {
    backgroundColor: '#10B981',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  restartButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  suggestionsScroll: {
    maxHeight: 500,
  },
  suggestionCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  suggestionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  suggestionNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  suggestionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  selectButtonContainer: {
    backgroundColor: '#2563EB',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  closeModalButton: {
    backgroundColor: '#6B7280',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  closeModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

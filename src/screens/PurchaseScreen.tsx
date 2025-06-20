// src/screens/PurchaseScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AwesomeAlert from 'react-native-awesome-alerts';
import { createSaleProtected } from '../services/saleService';
import { RootStackParamList } from '../types/navigation';

export default function PurchaseScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { ticketId, eventTitle, price, quantity } = route.params as any;

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(true);

  const showAlert = (title: string, message: string, success = true) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setIsSuccess(success);
    setAlertVisible(true);
  };

  const total = Number(price) * Number(quantity);

  const handleConfirm = async () => {
    if (!paymentMethod) {
      return showAlert('Atenção', 'Selecione uma forma de pagamento!', false);
    }
    setLoading(true);
    try {
      await createSaleProtected({ ticketId, quantity });
      showAlert('Sucesso', 'Compra realizada com sucesso!', true);
    } catch (err: any) {
      showAlert('Erro', err.message || 'Não foi possível processar a compra.', false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Finalizar Compra</Text>

      <Text style={styles.label}>Evento:</Text>
      <Text style={styles.value}>{eventTitle}</Text>

      <Text style={styles.label}>Quantidade:</Text>
      <Text style={styles.value}>{quantity}</Text>

      <Text style={styles.label}>Total:</Text>
      <Text style={styles.value}>R${total.toFixed(2)}</Text>

      <Text style={styles.label}>Forma de Pagamento:</Text>
      <View style={styles.paymentRow}>
        {['pix', 'credito', 'debito'].map((method) => (
          <Pressable
            key={method}
            style={({ pressed }) => [
              styles.paymentButton,
              paymentMethod === method && styles.paymentButtonSelected,
              pressed && styles.paymentButtonPressed,
            ]}
            onPress={() => setPaymentMethod(method)}
            disabled={loading}
          >
            <Text
              style={[
                styles.paymentText,
                paymentMethod === method && styles.paymentButtonSelectedText,
              ]}
            >
              {method.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.confirmButton,
          (!paymentMethod || loading) && styles.confirmButtonDisabled,
        ]}
        onPress={handleConfirm}
        disabled={!paymentMethod || loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmButtonText}>Confirmar Compra</Text>
        )}
      </TouchableOpacity>

      <View style={styles.backContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
      </View>

      <AwesomeAlert
        show={alertVisible}
        showProgress={false}
        title={alertTitle}
        message={alertMessage}
        closeOnTouchOutside
        closeOnHardwareBackPress
        showConfirmButton
        confirmText="OK"
        confirmButtonColor={isSuccess ? '#4CAF50' : '#F44336'}
        onConfirmPressed={() => {
          setAlertVisible(false);
          if (isSuccess) navigation.navigate('MyTickets');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fc',
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
    color: '#1976d2',
    letterSpacing: 0.5,
    textShadowColor: '#e3eafc',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
    color: '#607d8b',
    letterSpacing: 0.2,
    marginBottom: 8,
  },
  value: {
    fontSize: 20,
    marginBottom: 12,
    color: '#222',
    fontWeight: '500',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'center',    // centraliza o grupo
    marginVertical: 24,
  },
  paymentButton: {
    borderWidth: 2,
    borderColor: '#1976d2',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#e3eafc',
    marginHorizontal: 8,          // espaçamento igual entre botões
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentButtonPressed: {
    opacity: 0.7,
  },
  paymentButtonSelected: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
    transform: [{ scale: 1.03 }],
  },
  paymentText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 16,
  },
  paymentButtonSelectedText: {
    color: '#fff',
  },
  confirmButton: {
    backgroundColor: '#1976d2',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 36,
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonDisabled: {
    backgroundColor: '#b0bec5',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  backContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  backText: {
    color: '#1976d2',
    fontSize: 16,
    fontWeight: '600',
  },
});

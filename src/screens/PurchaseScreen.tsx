import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createSaleProtected } from '../services/saleService';
import { RootStackParamList } from '../types/navigation';

export default function PurchaseScreen() {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { ticketId, eventTitle, price, quantity } = route.params as any;
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);

  const total = Number(price) * Number(quantity);

  const handleConfirm = async () => {
    if (!paymentMethod) {
      Alert.alert('Selecione uma forma de pagamento!');
      return;
    }
    setLoading(true);
    try {
      await createSaleProtected({ ticketId, quantity });
      Alert.alert('Compra realizada com sucesso!');
      navigation.goBack();
    } catch (err: any) {
      // Interceptor trata sessão expirada
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
        <TouchableOpacity
          style={[styles.paymentButton, paymentMethod === 'pix' && styles.paymentButtonSelected]}
          onPress={() => setPaymentMethod('pix')}
          disabled={loading}
        >
          <Text style={[styles.paymentText, paymentMethod === 'pix' && styles.paymentButtonSelectedText]}>PIX</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.paymentButton, paymentMethod === 'credito' && styles.paymentButtonSelected]}
          onPress={() => setPaymentMethod('credito')}
          disabled={loading}
        >
          <Text style={[styles.paymentText, paymentMethod === 'credito' && styles.paymentButtonSelectedText]}>Crédito</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.paymentButton, paymentMethod === 'debito' && styles.paymentButtonSelected]}
          onPress={() => setPaymentMethod('debito')}
          disabled={loading}
        >
          <Text style={[styles.paymentText, paymentMethod === 'debito' && styles.paymentButtonSelectedText]}>Débito</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.confirmButton, !paymentMethod && styles.confirmButtonDisabled]}
        onPress={handleConfirm}
        disabled={!paymentMethod || loading}
      >
        <Text style={styles.confirmButtonText}>{loading ? 'Processando...' : 'Confirmar Compra'}</Text>
      </TouchableOpacity>

      {/* Botão pequeno para voltar ao Dashboard */}
      <View style={styles.backContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 12,
  },
  value: {
    fontSize: 20,
    marginBottom: 4,
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
    justifyContent: 'space-around',
    marginVertical: 26,
  },
  paymentButton: {
    borderWidth: 2,
    borderColor: '#1976d2',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 28,
    marginHorizontal: 6,
    backgroundColor: '#e3eafc',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
    minWidth: 100,
    alignItems: 'center',
  },
  paymentButtonSelected: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
    shadowOpacity: 0.18,
    transform: [{ scale: 1.06 }],
  },
  paymentText: {
    color: '#1976d2',
    fontWeight: 'bold',
    fontSize: 17,
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

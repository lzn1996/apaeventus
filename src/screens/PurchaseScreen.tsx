// src/screens/PurchaseScreen.tsx
import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Linking,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import AwesomeAlert from 'react-native-awesome-alerts';
import {createSaleProtected} from '../services/saleService';
import {RootStackParamList} from '../types/navigation';

export default function PurchaseScreen() {
  const route = useRoute();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {ticketId, eventTitle, price, quantity} = route.params as any;

  const [loading, setLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isSuccess, setIsSuccess] = useState(true);

  const showAlert = (title: string, message: string, success = true) => {
    setAlertTitle(title);
    setAlertMessage(message);
    setIsSuccess(success);
    setAlertVisible(true);
  };

  const total = Number(price) * Number(quantity);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const response = await createSaleProtected({ticketId, quantity});

      if (response && response.url) {
        // Redirecionar para o checkout do Stripe
        await Linking.openURL(response.url);
        // Voltar para o dashboard após abrir o link
        setTimeout(() => {
          navigation.navigate('Dashboard' as any);
        }, 1000);
      } else {
        showAlert('Erro', 'URL de pagamento não foi retornada.', false);
      }
    } catch (err: any) {
      showAlert(
        'Erro',
        err.message || 'Não foi possível processar a compra.',
        false,
      );
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

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Você será redirecionado para o site da Stripe para finalizar seu
          pagamento. Se a compra for feita com sucesso, você receberá um email
          com o ingresso.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.checkboxContainer}
        onPress={() => setAgreed(!agreed)}
        activeOpacity={0.7}>
        <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
          {agreed && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={styles.checkboxLabel}>
          Li e concordo com os termos acima
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.confirmButton,
          (!agreed || loading) && styles.confirmButtonDisabled,
        ]}
        onPress={handleConfirm}
        disabled={!agreed || loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.confirmButtonText}>Confirmar Compra</Text>
        )}
      </TouchableOpacity>

      <View style={styles.backContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Dashboard' as any)}>
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
          if (isSuccess) {
            navigation.navigate('Dashboard' as any);
          }
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
    textAlign: 'center',
    color: '#1976d2',
    letterSpacing: 0.5,
    textShadowColor: '#e3eafc',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 6,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 10,
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
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'center', // centraliza o grupo
    marginVertical: 24,
  },
  paymentButton: {
    borderWidth: 2,
    borderColor: '#1976d2',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#e3eafc',
    marginHorizontal: 8, // espaçamento igual entre botões
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
    transform: [{scale: 1.03}],
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
    marginTop: 24,
    shadowColor: '#1976d2',
    shadowOffset: {width: 0, height: 2},
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
    marginBottom: 30,
  },
  backText: {
    color: '#1976d2',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#1976d2',
    borderRadius: 8,
    padding: 16,
    marginTop: 24,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#1976d2',
    borderRadius: 6,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#1976d2',
    borderColor: '#1976d2',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#555',
    flex: 1,
    fontWeight: '500',
  },
});

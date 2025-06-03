import React from 'react';
import { View, Text } from 'react-native';
import styles from '../screens/RegisterScreen/styles';

interface PasswordStrengthMeterProps {
  senha: string;
  senhaForca: 'fraca' | 'média' | 'forte' | '';
}

const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ senha, senhaForca }) => {
  if (!senha) { return null; }

  let barraForcaStyle;
  switch (senhaForca) {
    case 'fraca':
      barraForcaStyle = styles.barraForcaFraca;
      break;
    case 'média':
      barraForcaStyle = styles.barraForcaMedia;
      break;
    case 'forte':
      barraForcaStyle = styles.barraForcaForte;
      break;
    default:
      barraForcaStyle = styles.barraForcaVazia;
  }

  // Define cor da letra conforme força
  let textoCorStyle;
  switch (senhaForca) {
    case 'fraca':
      textoCorStyle = styles.senhaForcaCorFraca;
      break;
    case 'média':
      textoCorStyle = styles.senhaForcaCorMedia;
      break;
    case 'forte':
      textoCorStyle = styles.senhaForcaCorForte;
      break;
    default:
      textoCorStyle = undefined;
  }

  return (
    <View style={styles.barraForcaContainer}>
      <View style={[styles.barraForca, barraForcaStyle]} />
      <Text style={[styles.senhaForca, textoCorStyle]}>Senha {senhaForca}</Text>
      {senhaForca === 'fraca' && (
        <Text style={styles.dicaSenha}>
          Adicione mais caracteres, letras, números e símbolos.
        </Text>
      )}
      {senhaForca === 'média' && (
        <Text style={styles.dicaSenha}>
          Tente adicionar símbolos para torná-la mais forte.
        </Text>
      )}
    </View>
  );
};

export default PasswordStrengthMeter;

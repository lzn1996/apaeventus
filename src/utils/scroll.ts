import { RefObject } from 'react';
import { TextInput, ScrollView } from 'react-native';

/**
 * Faz scroll automático para o input focado, garantindo que ele fique visível acima do teclado.
 * @param inputRef Ref do TextInput
 * @param scrollViewRef Ref do ScrollView
 * @param offset Offset vertical extra (padrão: 100)
 */
export function scrollToInput(
  inputRef: RefObject<TextInput | null>,
  scrollViewRef: RefObject<ScrollView | null>,
  offset: number = 100
) {
  setTimeout(() => {
    if (inputRef.current && scrollViewRef.current) {
      inputRef.current.measure((x, y, width, height, pageX, pageY) => {
        scrollViewRef.current?.scrollTo({ y: (pageY || 0) - offset, animated: true });
      });
    }
  }, 100);
}

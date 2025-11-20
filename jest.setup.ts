import '@testing-library/jest-native/extend-expect';
import { Animated } from 'react-native';
import { act } from '@testing-library/react-native';

// Suprime warning específico de suspended act do NavigationContainer e EditProfileScreen
const originalError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('A component suspended inside an `act` scope') ||
     args[0].includes('An update to') ||  // Suprime todos os warnings de updates não wrapped em act
     args[0].includes('was not wrapped in act'))
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// Mock react-native-reanimated (versão 4.x compatível Expo 54)
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Mock completo de Animated para evitar loops infinitos e acelerar testes
const originalWarn = console.warn;
beforeAll(() => {
  // Desabilita animações - torna todas instantâneas
  jest.spyOn(Animated, 'timing').mockImplementation((value, config) => {
    return {
      start: (callback?: any) => {
        act(() => {
          (value as any).setValue(config.toValue);
        });
        callback?.({ finished: true });
      },
      stop: jest.fn(),
      reset: jest.fn(),
    } as any;
  });

  jest.spyOn(Animated, 'spring').mockImplementation((value, config) => {
    return {
      start: (callback?: any) => {
        act(() => {
          (value as any).setValue(config.toValue);
        });
        callback?.({ finished: true });
      },
      stop: jest.fn(),
      reset: jest.fn(),
    } as any;
  });

  jest.spyOn(Animated, 'parallel').mockImplementation((animations) => {
    return {
      start: (callback?: any) => {
        animations.forEach((anim: any) => anim.start());
        callback?.({ finished: true });
      },
      stop: jest.fn(),
      reset: jest.fn(),
    } as any;
  });

  jest.spyOn(Animated, 'sequence').mockImplementation((animations) => {
    return {
      start: (callback?: any) => {
        animations.forEach((anim: any) => anim.start());
        callback?.({ finished: true });
      },
      stop: jest.fn(),
      reset: jest.fn(),
    } as any;
  });

  jest.spyOn(Animated, 'loop').mockImplementation(() => {
    return {
      start: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
    } as any;
  });

  jest.spyOn(global, 'requestAnimationFrame').mockImplementation(cb => {
    cb(0);
    return 0;
  });
});

afterAll(() => {
  console.warn = originalWarn;
});

// Mock expo-linear-gradient
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  return {
    LinearGradient: ({ children }: { children: React.ReactNode }) => React.createElement('View', null, children),
  };
});

// Mock expo-asset para evitar chamadas a setCustomSourceTransformer
jest.mock('expo-asset', () => ({
  Asset: {
    fromModule: () => ({
      downloadAsync: async () => {},
      localUri: undefined,
    }),
  },
}));

// Mock expo-font simplificado
jest.mock('expo-font', () => ({
  loadAsync: async () => {},
}));

// Mock @expo/vector-icons retornando componentes vazios
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  return new Proxy({}, {
    get: () => (props: any) => React.createElement('View', props),
  });
});

// Mock AsyncStorage simples (se necessário em testes)
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

// Mock de Navigation para evitar erros de contexto quando necessário
// (Para testes que não envolvem navegação real, podemos mockar métodos básicos.)
jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({ navigate: jest.fn(), replace: jest.fn(), goBack: jest.fn() }),
  };
});

// Mock NetInfo para evitar erros de isInternetReachable
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() => Promise.resolve({
    type: 'wifi',
    isConnected: true,
    isInternetReachable: true,
  })),
  addEventListener: jest.fn(() => jest.fn()),
}));

// Mock react-native-safe-area-context para evitar erros de useSafeAreaInsets
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const actualModule = jest.requireActual('react-native-safe-area-context');
  
  return {
    ...actualModule,
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) => {
      const SafeAreaContext = React.createContext({ top: 0, right: 0, bottom: 0, left: 0 });
      return React.createElement(SafeAreaContext.Provider, { value: { top: 0, right: 0, bottom: 0, left: 0 } }, children);
    },
    SafeAreaView: ({ children }: { children: React.ReactNode }) => React.createElement('View', null, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
  };
});





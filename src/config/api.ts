// src/config/api.ts
// Centraliza a configuração da baseUrl para requisições à API
import { Platform } from 'react-native';

export const baseUrl = Platform.OS === 'android'
    ? 'http://10.0.2.2:3333'
    : 'http://localhost:3333';

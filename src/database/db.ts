// src/database/db.ts
// Função utilitária para abrir conexão SQLite com Expo
import * as SQLite from 'expo-sqlite';

export function openDatabase() {
    return SQLite.openDatabaseSync('apaeventus.db');
}

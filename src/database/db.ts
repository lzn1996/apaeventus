// src/database/db.ts
// Função utilitária para abrir conexão SQLite
import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

export function openDatabase() {
    return SQLite.openDatabase({ name: 'apaeventus.db', location: 'default' });
}

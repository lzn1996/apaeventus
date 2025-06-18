// src/database/init.ts
// Criação das tabelas SQLite para suporte offline dos ingressos
import { openDatabase } from './db';

export async function initDatabase() {
    const db = await openDatabase();

    // Ativa chaves estrangeiras
    await db.executeSql('PRAGMA foreign_keys = ON;');

    // Tabela de eventos
    await db.executeSql(`
        CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT,
        location TEXT,
        imageUrl TEXT,
        last_updated INTEGER,
        isSynced INTEGER DEFAULT 1
        );
    `);

    // Tabela de ingressos
    await db.executeSql(`
        CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        type TEXT,
        code TEXT,
        used INTEGER DEFAULT 0,
        qrCodeUrl TEXT,
        pdfUrl TEXT,
        qrCodeDataUrl TEXT,
        buyer_name TEXT,
        buyer_email TEXT,
        buyer_phone TEXT,
        boughtAt TEXT,
        price REAL,
        last_updated INTEGER,
        isSynced INTEGER DEFAULT 1
        );
    `);

    // Fila de sincronização (operações offline)
    await db.executeSql(`
        CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL, -- ex: 'UPDATE_TICKET', 'MARK_USED'
        payload TEXT NOT NULL, -- JSON string
        timestamp INTEGER NOT NULL
        );
    `);

    // Status de sincronização
    await db.executeSql(`
        CREATE TABLE IF NOT EXISTS sync_status (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        last_sync INTEGER,
        last_error TEXT
        );
    `);

    // Tabela de perfil do usuário
    await db.executeSql(`
        CREATE TABLE IF NOT EXISTS user_profile (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        cellphone TEXT,
        phone TEXT,
        rg TEXT
        );
    `);

    return db;
}

// Função utilitária para limpar todas as tabelas do banco local (apenas para depuração)
export async function resetLocalDatabase() {
    const db = await openDatabase();
    // Limpa todas as tabelas
    await db.executeSql('DELETE FROM tickets');
    await db.executeSql('DELETE FROM events');
    await db.executeSql('DELETE FROM sync_status');
    await db.executeSql('DELETE FROM sync_queue');
    await db.executeSql('DELETE FROM user_profile');
    // Garante estrutura correta da tabela user_profile (com coluna rg)
    await db.executeSql('DROP TABLE IF EXISTS user_profile');
    await db.executeSql(`
        CREATE TABLE IF NOT EXISTS user_profile (
        id TEXT PRIMARY KEY,
        name TEXT,
        email TEXT,
        cellphone TEXT,
        phone TEXT,
        rg TEXT
        );
    `);
    console.log('Banco local limpo e tabela user_profile recriada com coluna rg!');
}

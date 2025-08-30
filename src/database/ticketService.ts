// src/database/ticketService.ts
// Funções para inserir, consultar e atualizar ingressos e eventos no SQLite
import { openDatabase } from './db';

interface EventDB {
    id: string;
    title: string;
    date: string;
    time?: string;
    location?: string;
    imageUrl?: string;
    last_updated?: number;
}

export interface TicketDB {
    id: string;
    event_id: string;
    type?: string;
    code?: string;
    used?: boolean | number;
    qrCodeUrl?: string;
    pdfUrl?: string;
    qrCodeDataUrl?: string;
    buyer_name?: string;
    buyer_email?: string;
    buyer_phone?: string;
    boughtAt?: string;
    price?: number;
    last_updated?: number;
}

export async function insertOrUpdateEvent(event: EventDB) {
    const db = openDatabase();
    db.runSync(
        `INSERT OR REPLACE INTO events (id, title, date, time, location, imageUrl, last_updated, isSynced)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [
            event.id,
            event.title,
            event.date,
            event.time || null,
            event.location || null,
            event.imageUrl || null,
            event.last_updated || Date.now(),
        ]
    );
}

export async function insertOrUpdateTicket(ticket: TicketDB) {
    const db = openDatabase();
    db.runSync(
        `INSERT OR REPLACE INTO tickets (id, event_id, type, code, used, qrCodeUrl, pdfUrl, qrCodeDataUrl, buyer_name, buyer_email, buyer_phone, boughtAt, price, last_updated, isSynced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
            ticket.id,
            ticket.event_id,
            ticket.type || null,
            ticket.code || null,
            ticket.used ? 1 : 0,
            ticket.qrCodeUrl || null,
            ticket.pdfUrl || null,
            ticket.qrCodeDataUrl || null,
            ticket.buyer_name || null,
            ticket.buyer_email || null,
            ticket.buyer_phone || null,
            ticket.boughtAt || null,
            ticket.price || null,
            ticket.last_updated || Date.now(),
        ]
    );
}

export async function getAllEvents() {
    const db = openDatabase();
    const res = db.getAllSync('SELECT * FROM events ORDER BY date DESC, time DESC');
    return res as EventDB[];
}

export async function getTicketsByEvent(eventId: string) {
    const db = openDatabase();
    const res = db.getAllSync(
        'SELECT * FROM tickets WHERE event_id = ? ORDER BY boughtAt DESC',
        [eventId]
    );
    return res as TicketDB[];
}

export async function markTicketUsed(ticketId: string) {
    const db = openDatabase();
    db.runSync(
        'UPDATE tickets SET used = 1, isSynced = 0, last_updated = ? WHERE id = ?',
        [Date.now(), ticketId]
    );
}

export async function addToSyncQueue(type: string, payload: any) {
    const db = openDatabase();
    db.runSync(
        'INSERT INTO sync_queue (type, payload, timestamp) VALUES (?, ?, ?)',
        [type, JSON.stringify(payload), Date.now()]
    );
}

export async function logAllTicketsWithValidation() {
    const db = openDatabase();
    const all = db.getAllSync('SELECT * FROM tickets');
    // Destaca registros com campos críticos faltando
    const byEvent: Record<string, string[]> = {};
    all.forEach((t: any) => {
        if (!byEvent[t.event_id]) { byEvent[t.event_id] = []; }
        byEvent[t.event_id].push(t.id);
    });
}

// Função para resetar o banco local (DROPA e recria todas as tabelas)
export async function resetLocalDatabase() {
    const db = openDatabase();
    db.execSync('DROP TABLE IF EXISTS tickets');
    db.execSync('DROP TABLE IF EXISTS events');
    db.execSync('DROP TABLE IF EXISTS sync_queue');
    db.execSync('DROP TABLE IF EXISTS sync_status');
    // Recria as tabelas
    await import('./init').then(m => m.initDatabase());
}

export async function resetAllDatabaseTables() {
    const db = openDatabase();
    // Dropa todas as tabelas relevantes
    db.execSync('DROP TABLE IF EXISTS tickets');
    db.execSync('DROP TABLE IF EXISTS events');
    db.execSync('DROP TABLE IF EXISTS sync_queue');
    db.execSync('DROP TABLE IF EXISTS sync_status');
    // Recria as tabelas
    await import('./init').then(m => m.initDatabase());
}

export async function testManualInsertTicketsSameEvent() {
    const db = openDatabase();
    const eventId = 'TEST-EVENT-123';
    // Cria evento fake
    db.runSync(
        `INSERT OR REPLACE INTO events (id, title, date, time, location, imageUrl, last_updated, isSynced)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [eventId, 'Evento Teste', '2025-06-10', '19:00', 'Local Teste', '', Date.now()]
    );
    // Insere dois tickets com IDs diferentes
    db.runSync(
        `INSERT OR REPLACE INTO tickets (id, event_id, type, code, used, qrCodeUrl, pdfUrl, qrCodeDataUrl, buyer_name, buyer_email, buyer_phone, boughtAt, price, last_updated, isSynced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        ['TICKET-1', eventId, 'TIPO1', 'CODE1', 0, '', '', '', 'Tester', 'tester@email.com', '999999999', '2025-06-10T19:00:00Z', 10, Date.now()]
    );
    db.runSync(
        `INSERT OR REPLACE INTO tickets (id, event_id, type, code, used, qrCodeUrl, pdfUrl, qrCodeDataUrl, buyer_name, buyer_email, buyer_phone, boughtAt, price, last_updated, isSynced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        ['TICKET-2', eventId, 'TIPO2', 'CODE2', 0, '', '', '', 'Tester', 'tester@email.com', '999999999', '2025-06-10T19:00:00Z', 20, Date.now()]
    );
}

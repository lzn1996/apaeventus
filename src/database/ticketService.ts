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
    const db = await openDatabase();
    await db.executeSql(
        `INSERT OR REPLACE INTO events (id, title, date, time, location, imageUrl, last_updated, isSynced)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [
            event.id,
            event.title,
            event.date,
            event.time,
            event.location,
            event.imageUrl,
            event.last_updated || Date.now(),
        ]
    );
}

export async function insertOrUpdateTicket(ticket: TicketDB) {
    const db = await openDatabase();
    await db.executeSql(
        `INSERT OR REPLACE INTO tickets (id, event_id, type, code, used, qrCodeUrl, pdfUrl, qrCodeDataUrl, buyer_name, buyer_email, buyer_phone, boughtAt, price, last_updated, isSynced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
            ticket.id,
            ticket.event_id,
            ticket.type,
            ticket.code,
            ticket.used ? 1 : 0,
            ticket.qrCodeUrl,
            ticket.pdfUrl,
            ticket.qrCodeDataUrl,
            ticket.buyer_name,
            ticket.buyer_email,
            ticket.buyer_phone,
            ticket.boughtAt,
            ticket.price,
            ticket.last_updated || Date.now(),
        ]
    );
}

export async function getAllEvents() {
    const db = await openDatabase();
    const res = await db.executeSql('SELECT * FROM events ORDER BY date DESC, time DESC');
    const result: EventDB[] = [];
    if (res[0] && res[0].rows && res[0].rows.length > 0) {
        for (let i = 0; i < res[0].rows.length; i++) {
            result.push(res[0].rows.item(i));
        }
    }
    return result;
}

export async function getTicketsByEvent(eventId: string) {
    const db = await openDatabase();
    const res = await db.executeSql(
        'SELECT * FROM tickets WHERE event_id = ? ORDER BY boughtAt DESC',
        [eventId]
    );
    const result: TicketDB[] = [];
    if (res[0] && res[0].rows && res[0].rows.length > 0) {
        for (let i = 0; i < res[0].rows.length; i++) {
            result.push(res[0].rows.item(i));
        }
    }
    return result;
}

export async function markTicketUsed(ticketId: string) {
    const db = await openDatabase();
    await db.executeSql(
        'UPDATE tickets SET used = 1, isSynced = 0, last_updated = ? WHERE id = ?',
        [Date.now(), ticketId]
    );
}

export async function addToSyncQueue(type: string, payload: any) {
    const db = await openDatabase();
    await db.executeSql(
        'INSERT INTO sync_queue (type, payload, timestamp) VALUES (?, ?, ?)',
        [type, JSON.stringify(payload), Date.now()]
    );
}

export async function logAllTickets() {
    const db = await openDatabase();
    const res = await db.executeSql('SELECT * FROM tickets');
    console.log('[ticketService] Todos os ingressos no banco:', res[0].rows.length, res[0].rows.raw());
}

export async function logAllTicketsWithValidation() {
    const db = await openDatabase();
    const res = await db.executeSql('SELECT * FROM tickets');
    const all = res[0].rows.raw();
    console.log('[ticketService] Todos os ingressos no banco:', all.length, all);
    // Destaca registros com campos críticos faltando
    const invalid = all.filter(t => !t.id || !t.event_id || !t.code);
    if (invalid.length > 0) {
        console.warn('[ticketService] Ingressos com campos críticos faltando:', invalid);
    } else {
        console.log('[ticketService] Todos os ingressos possuem id, event_id e code preenchidos.');
    }
    // Loga todos os event_id e conta quantos tickets por evento
    const byEvent: Record<string, string[]> = {};
    all.forEach(t => {
        if (!byEvent[t.event_id]) { byEvent[t.event_id] = []; }
        byEvent[t.event_id].push(t.id);
    });
    Object.entries(byEvent).forEach(([eventId, ids]) => {
        console.log(`[ticketService] event_id=${eventId} possui ${ids.length} ingressos:`, ids);
    });
    // Loga todos os códigos de ingresso para garantir unicidade
    const codes = all.map(t => t.code);
    const uniqueCodes = new Set(codes);
    if (codes.length !== uniqueCodes.size) {
        console.warn('[ticketService] Existem códigos de ingresso duplicados:', codes);
    } else {
        console.log('[ticketService] Todos os códigos de ingresso são únicos.');
    }
}

// Função para resetar o banco local (DROPA e recria todas as tabelas)
export async function resetLocalDatabase() {
    const db = await openDatabase();
    await db.executeSql('DROP TABLE IF EXISTS tickets');
    await db.executeSql('DROP TABLE IF EXISTS events');
    await db.executeSql('DROP TABLE IF EXISTS sync_queue');
    await db.executeSql('DROP TABLE IF EXISTS sync_status');
    // Recria as tabelas
    await import('./init').then(m => m.initDatabase());
    console.log('[ticketService] Banco local resetado e tabelas recriadas!');
}

export async function resetAllDatabaseTables() {
    const db = await openDatabase();
    await db.transaction(async (tx) => {
        // Dropa todas as tabelas relevantes
        await tx.executeSql('DROP TABLE IF EXISTS tickets');
        await tx.executeSql('DROP TABLE IF EXISTS events');
        await tx.executeSql('DROP TABLE IF EXISTS sync_queue');
        await tx.executeSql('DROP TABLE IF EXISTS sync_status');
    });
    // Recria as tabelas
    await import('./init').then(m => m.initDatabase());
    console.log('[ticketService] Todas as tabelas do banco local foram resetadas e recriadas.');
}

export async function testManualInsertTicketsSameEvent() {
    const db = await openDatabase();
    const eventId = 'TEST-EVENT-123';
    // Cria evento fake
    await db.executeSql(
        `INSERT OR REPLACE INTO events (id, title, date, time, location, imageUrl, last_updated, isSynced)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [eventId, 'Evento Teste', '2025-06-10', '19:00', 'Local Teste', '', Date.now()]
    );
    // Insere dois tickets com IDs diferentes
    await db.executeSql(
        `INSERT OR REPLACE INTO tickets (id, event_id, type, code, used, qrCodeUrl, pdfUrl, qrCodeDataUrl, buyer_name, buyer_email, buyer_phone, boughtAt, price, last_updated, isSynced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        ['TICKET-1', eventId, 'TIPO1', 'CODE1', 0, '', '', '', 'Tester', 'tester@email.com', '999999999', '2025-06-10T19:00:00Z', 10, Date.now()]
    );
    await db.executeSql(
        `INSERT OR REPLACE INTO tickets (id, event_id, type, code, used, qrCodeUrl, pdfUrl, qrCodeDataUrl, buyer_name, buyer_email, buyer_phone, boughtAt, price, last_updated, isSynced)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        ['TICKET-2', eventId, 'TIPO2', 'CODE2', 0, '', '', '', 'Tester', 'tester@email.com', '999999999', '2025-06-10T19:00:00Z', 20, Date.now()]
    );
    // Consulta todos os tickets desse evento
    const res = await db.executeSql('SELECT id, event_id, code FROM tickets WHERE event_id = ?', [eventId]);
    console.log('[TESTE MANUAL] Tickets inseridos para event_id', eventId, ':', res[0].rows.raw());
}

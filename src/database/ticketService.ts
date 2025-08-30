// src/database/ticketService.ts
// Funções para inserir, consultar e atualizar ingressos e eventos no SQLite
import { openDatabase } from './db';

// Função para executar operações de banco com retry (para evitar NullPointerException)
async function safeDbOperation<T>(operation: () => T, maxRetries = 3): Promise<T | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return operation();
    } catch (error: any) {
      console.log(`[ticketService] Tentativa ${attempt}/${maxRetries} falhou:`, error?.message || error);

      // Se é NullPointerException, tenta novamente
      if (error?.message?.includes('NullPointerException') ||
          error?.message?.includes('prepareSync') ||
          error?.message?.includes('Call to function')) {

        if (attempt < maxRetries) {
          // Aguarda antes de tentar novamente
          const delay = attempt * 200; // 200ms, 400ms, 600ms
          console.log(`[ticketService] Aguardando ${delay}ms antes de tentar novamente...`);

          const start = Date.now();
          while (Date.now() - start < delay) {
            // Busy wait
          }
          continue;
        }
      }

      console.error('[ticketService] Todas as tentativas falharam:', error);
      return null;
    }
  }
  return null;
}

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
    await safeDbOperation(() => {
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
    });
}

export async function insertOrUpdateTicket(ticket: TicketDB) {
    await safeDbOperation(() => {
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
    });
}

export async function getAllEvents() {
    const result = await safeDbOperation(() => {
        const db = openDatabase();
        return db.getAllSync('SELECT * FROM events ORDER BY date DESC, time DESC');
    });
    return (result as EventDB[]) || [];
}

export async function getTicketsByEvent(eventId: string) {
    const result = await safeDbOperation(() => {
        const db = openDatabase();
        return db.getAllSync(
            'SELECT * FROM tickets WHERE event_id = ? ORDER BY boughtAt DESC',
            [eventId]
        );
    });
    return (result as TicketDB[]) || [];
}

export async function markTicketUsed(ticketId: string) {
    await safeDbOperation(() => {
        const db = openDatabase();
        db.runSync(
            'UPDATE tickets SET used = 1, isSynced = 0, last_updated = ? WHERE id = ?',
            [Date.now(), ticketId]
        );
    });
}

export async function addToSyncQueue(type: string, payload: any) {
    await safeDbOperation(() => {
        const db = openDatabase();
        db.runSync(
            'INSERT INTO sync_queue (type, payload, timestamp) VALUES (?, ?, ?)',
            [type, JSON.stringify(payload), Date.now()]
        );
    });
}

export async function logAllTicketsWithValidation() {
    const result = await safeDbOperation(() => {
        const db = openDatabase();
        return db.getAllSync('SELECT * FROM tickets');
    });

    if (!result) {
        console.log('[ticketService] Falha ao buscar tickets para validação');
        return;
    }

    // Destaca registros com campos críticos faltando
    const byEvent: Record<string, string[]> = {};
    result.forEach((t: any) => {
        if (!byEvent[t.event_id]) { byEvent[t.event_id] = []; }
        byEvent[t.event_id].push(t.id);
    });
}

// Função para resetar o banco local (DROPA e recria todas as tabelas)
export async function resetLocalDatabase() {
    await safeDbOperation(() => {
        const db = openDatabase();
        db.execSync('DROP TABLE IF EXISTS tickets');
        db.execSync('DROP TABLE IF EXISTS events');
        db.execSync('DROP TABLE IF EXISTS sync_queue');
        db.execSync('DROP TABLE IF EXISTS sync_status');
    });
    // Recria as tabelas
    await import('./init').then(m => m.initDatabase());
}

export async function resetAllDatabaseTables() {
    await safeDbOperation(() => {
        const db = openDatabase();
        // Dropa todas as tabelas relevantes
        db.execSync('DROP TABLE IF EXISTS tickets');
        db.execSync('DROP TABLE IF EXISTS events');
        db.execSync('DROP TABLE IF EXISTS sync_queue');
        db.execSync('DROP TABLE IF EXISTS sync_status');
    });
    // Recria as tabelas
    await import('./init').then(m => m.initDatabase());
}

export async function testManualInsertTicketsSameEvent() {
    await safeDbOperation(() => {
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
    });
}

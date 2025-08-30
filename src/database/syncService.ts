// src/database/syncService.ts
// Serviço de sincronização bidirecional entre API e SQLite
import { openDatabase } from './db';
import { getUserSales } from '../services/saleService';
import { Sale } from '../services/saleService';
import { getUserProfile } from '../services/userService';
import { logAllTicketsWithValidation } from './ticketService';
import { setTicketUsed, setTicketUnused } from './ticketService.extra';

// Busca atualizações do servidor e atualiza o SQLite
export async function syncFromServer() {
  // Busca vendas/ingressos do usuário na API
    const sales: Sale[] = await getUserSales();
    // Busca o profile do usuário autenticado
    const profile = await getUserProfile();
    const buyer_name = profile?.name || '';
    const buyer_email = profile?.email || '';
    const buyer_phone = profile?.cellphone || profile?.phone || '';
    const db = openDatabase();

    const insertedTicketIds: string[] = [];
    const errorTickets: {ticketId: string, eventId: string, error: any}[] = [];

    for (const sale of sales) {
        const eventId = sale.ticket.id;
        const ticketId = sale.id;
        // Não existe campo code real, usa ticketId como code
        const ticketCode = ticketId;

        try {
            db.runSync(
                `INSERT OR REPLACE INTO events (id, title, date, time, location, imageUrl, last_updated, isSynced)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
                [
                    eventId,
                    sale.ticket.title || '',
                    sale.ticket.eventDate.split('T')[0],
                    sale.ticket.eventDate.split('T')[1]?.slice(0, 5) || '',
                    sale.ticket.description || '',
                    sale.ticket.imageUrl || '',
                    Date.now(),
                ]
            );

            const ticketValues = [
                ticketId,
                eventId,
                sale.ticket.title || '',
                ticketCode,
                sale.used ? 1 : 0,
                sale.qrCodeUrl || '',
                sale.pdfUrl || '',
                sale.qrCodeDataUrl || '',
                buyer_name || '',
                buyer_email || '',
                buyer_phone || '',
                sale.createdAt || '',
                sale.ticket.price || 0,
                Date.now(),
            ];

            db.runSync(
                `INSERT OR REPLACE INTO tickets (id, event_id, type, code, used, qrCodeUrl, pdfUrl, qrCodeDataUrl, buyer_name, buyer_email, buyer_phone, boughtAt, price, last_updated, isSynced)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                ticketValues
            );

            insertedTicketIds.push(ticketId);
        } catch (err) {
            errorTickets.push({ticketId, eventId, error: err});
        }
    }

    // Log detalhado dos ingressos após sync
    try {
        await logAllTicketsWithValidation();
    } catch (error) {
        console.error('[syncService] DEBUG: Erro ao verificar dados:', error);
    }

    // Após atualizar tickets locais com dados do backend, sincroniza pendências offline
    const pendentes = await getTicketsPendingSync();
    for (const ticket of pendentes) {
        try {
            if ((ticket as any).used) {
            await setTicketUsed((ticket as any).id);
            } else {
            await setTicketUnused((ticket as any).id);
            }
            await updateTicketStatusLocal((ticket as any).id, { isSynced: 1 });
        } catch (err) {
            // Erro silencioso
        }
    }
}

// Envia operações pendentes da fila para o servidor
export async function syncToServer(processQueueItem: (item: any) => Promise<boolean>) {
    const db = openDatabase();
    try {
        const items = db.getAllSync('SELECT * FROM sync_queue ORDER BY timestamp ASC');

        for (const item of items) {
            try {
            const ok = await processQueueItem(item);
            if (ok) {
                db.runSync('DELETE FROM sync_queue WHERE id = ?', [(item as any).id]);
            } else {
                // Se falhar, para a sincronização
                break;
            }
            } catch (e) {
            // Se erro, para a sincronização
            break;
            }
        }
    } catch (error) {
        // Erro silencioso na sincronização para servidor
    }
}// Função principal de sincronização
export async function syncAll(_userId: string, processQueueItem: (item: any) => Promise<boolean>, _lastSync: number | null = null) {
    await syncFromServer();
    await syncToServer(processQueueItem);
}

// Função para buscar tickets pendentes de sync
async function getTicketsPendingSync() {
  const db = openDatabase();
  try {
    const res = db.getAllSync('SELECT * FROM tickets WHERE isSynced = 0');
    return res;
  } catch (error) {
    return [];
  }
}

// Função para atualizar status de sync local
async function updateTicketStatusLocal(ticketId: string, patch: Partial<any>) {
  const db = openDatabase();
  try {
    const fields = Object.keys(patch).map(k => `${k} = ?`).join(', ');
    const values = Object.values(patch);
    db.runSync(`UPDATE tickets SET ${fields} WHERE id = ?`, [...values, ticketId]);
  } catch (error) {
    // Erro silencioso
  }
}

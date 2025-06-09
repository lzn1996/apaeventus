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
    // Loga todos os ids recebidos da API
    console.log('[syncService] IDs dos sales recebidos da API:', sales.map(s => s.id));
    // Busca o profile do usuário autenticado
    const profile = await getUserProfile();
    const buyer_name = profile?.name || '';
    const buyer_email = profile?.email || '';
    const buyer_phone = profile?.cellphone || profile?.phone || '';
    const db = await openDatabase();
    // Loga o conteúdo da tabela tickets antes da sync
    const beforeRes = await db.executeSql('SELECT * FROM tickets');
    console.log('[syncService] Conteúdo da tabela tickets ANTES do sync:', beforeRes[0].rows.length, beforeRes[0].rows.raw());
    await new Promise<void>((resolve, reject) => {
        const insertedTicketIds: string[] = [];
        const errorTickets: {ticketId: string, eventId: string, error: any}[] = [];
        db.transaction(
        tx => {
            for (const sale of sales) {
                // Loga o objeto sale completo recebido da API
                console.log('[syncService][LOG PATCH] Sale recebido da API:', JSON.stringify(sale));
                const eventId = sale.ticket.id;
                const ticketId = sale.id;
                // Não existe campo code real, usa ticketId como code
                const ticketCode = ticketId;
                // Loga os campos críticos
                console.log('[syncService][LOG PATCH] ticketId:', ticketId, 'eventId:', eventId, 'ticketCode:', ticketCode, '[ATENÇÃO: não existe campo code real no objeto Sale]');
                if (ticketId === eventId) {
                    console.warn('[syncService][LOG PATCH][ALERTA] ticketId === eventId! Isso indica bug de mapeamento. ticketId:', ticketId, 'eventId:', eventId);
                }
                try {
                    // Log antes de inserir evento
                    console.log('[syncService][LOG PATCH] Tentando inserir/atualizar evento:', eventId, sale.ticket.title);
                    tx.executeSql(
                        `INSERT OR REPLACE INTO events (id, title, date, time, location, imageUrl, last_updated, isSynced)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,

                        [
                            eventId,
                            sale.ticket.title,
                            sale.ticket.eventDate.split('T')[0],
                            sale.ticket.eventDate.split('T')[1]?.slice(0, 5),
                            sale.ticket.description,
                            sale.ticket.imageUrl,
                            Date.now(),
                        ],
                        (_txObj) => {
                            console.log('[syncService][LOG PATCH] Evento inserido/atualizado OK:', eventId);
                        },
                        (_txObj, error) => {
                            console.error('[syncService][LOG PATCH] ERRO ao inserir evento:', eventId, error);
                        }
                    );
                    // Checa se o evento existe antes de inserir ticket
                    tx.executeSql(
                        'SELECT * FROM events WHERE id = ?',
                        [eventId],
                        (_txObj, resultSet) => {
                            if (resultSet.rows.length === 0) {
                                console.error('[syncService][LOG PATCH] ATENÇÃO: Evento não existe na tabela events antes de inserir ticket:', eventId);
                            } else {
                                console.log('[syncService][LOG PATCH] Evento existe na tabela events antes de inserir ticket:', eventId);
                            }
                        },
                        (_txObj, error) => {
                            console.error('[syncService][LOG PATCH] ERRO ao checar evento antes do ticket:', eventId, error);
                        }
                    );
                    try {
                        const ticketValues = [
                            ticketId,
                            eventId,
                            sale.ticket.title,
                            ticketCode,
                            sale.used ? 1 : 0,
                            sale.qrCodeUrl,
                            sale.pdfUrl,
                            sale.qrCodeDataUrl,
                            buyer_name,
                            buyer_email,
                            buyer_phone,
                            sale.createdAt,
                            sale.ticket.price,
                            Date.now(),
                        ];
                        console.log('[syncService][LOG PATCH] Tentando inserir ingresso:', ticketValues);
                        tx.executeSql(
                            `INSERT OR REPLACE INTO tickets (id, event_id, type, code, used, qrCodeUrl, pdfUrl, qrCodeDataUrl, buyer_name, buyer_email, buyer_phone, boughtAt, price, last_updated, isSynced)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)` ,
                            ticketValues,
                            (_txObj, _resultSet) => {
                                console.log('[syncService][LOG PATCH] Insert OK para ingresso:', ticketId);
                            },
                            (_txObj, error) => {
                                errorTickets.push({ticketId, eventId, error});
                                console.error('[syncService][LOG PATCH][ERRO INSERT] Falha ao inserir ingresso:', ticketId, 'event_id:', eventId, error, 'Valores:', ticketValues);
                                throw new Error(`[syncService][LOG PATCH] Falha ao inserir ingresso: ${ticketId} event_id: ${eventId} - Motivo: ${error.message}`);
                            }
                        );
                        insertedTicketIds.push(ticketId);
                    } catch (err) {
                        errorTickets.push({ticketId, eventId, error: err});
                        console.error('[syncService][LOG PATCH] Erro ao inserir ingresso (try/catch):', ticketId, 'event_id:', eventId, err);
                        throw err;
                    }
                } catch (err) {
                    errorTickets.push({ticketId, eventId, error: err});
                    console.error('[syncService][LOG PATCH] Erro ao inserir ingresso (try/catch):', ticketId, 'event_id:', eventId, err);
                    // PAUSA a transação lançando erro
                    throw err;
                }
                console.log('[syncService][LOG PATCH] Salvando ingresso:', ticketId, 'event_id:', eventId);
            }
        },
        error => {
            console.error('[syncService][LOG PATCH] Erro na transação de sync:', error);
            reject(error);
        },
        async () => {
            // Loga o conteúdo da tabela tickets depois da sync
            const res = await db.executeSql('SELECT * FROM tickets');
            console.log('[syncService][LOG PATCH] Conteúdo da tabela tickets DEPOIS do sync:', res[0].rows.length, res[0].rows.raw());
            // Log extra: IDs presentes na tabela tickets
            const [resIds] = await db.executeSql('SELECT id, event_id FROM tickets');
            console.log('[syncService][LOG PATCH] IDs e event_ids na tabela tickets:', resIds.rows.raw());
            const resEvents = await db.executeSql('SELECT * FROM events');
            console.log('[syncService][LOG PATCH] Eventos no banco após sync:', resEvents[0].rows.length, resEvents[0].rows.raw());
            if (insertedTicketIds.length !== sales.length) {
                const expectedIds = sales.map(s => s.id);
                const missing = expectedIds.filter(id => !insertedTicketIds.includes(id));
                console.error(`[syncService][LOG PATCH] ATENÇÃO: Esperado inserir ${sales.length} ingressos, mas só ${insertedTicketIds.length} foram inseridos. IDs faltando:`, missing, 'Erros:', errorTickets);
            }
            // Log detalhado dos ingressos após sync
            await logAllTicketsWithValidation();
            // Após atualizar tickets locais com dados do backend, sincroniza pendências offline
            const pendentes = await getTicketsPendingSync();
            for (const ticket of pendentes) {
                try {
                  if (ticket.used) {
                    await setTicketUsed(ticket.id);
                  } else {
                    await setTicketUnused(ticket.id);
                  }
                  await updateTicketStatusLocal(ticket.id, { isSynced: 1 });
                } catch (err) {
                  console.error('[syncService] Falha ao sincronizar ticket pendente:', ticket.id, err);
                }
              }
            resolve();
        }
        );
    });
    }

    // Envia operações pendentes da fila para o servidor
    export async function syncToServer(processQueueItem: (item: any) => Promise<boolean>) {
    const db = await openDatabase();
    const res = await db.executeSql('SELECT * FROM sync_queue ORDER BY timestamp ASC');
    const items = [];
    if (res[0] && res[0].rows && res[0].rows.length > 0) {
        for (let i = 0; i < res[0].rows.length; i++) {
        items.push(res[0].rows.item(i));
        }
    }
    for (const item of items) {
        try {
        const ok = await processQueueItem(item);
        if (ok) {
            await db.executeSql('DELETE FROM sync_queue WHERE id = ?', [item.id]);
        } else {
            // Se falhar, para a sincronização
            break;
        }
        } catch (e) {
        // Se erro, para a sincronização
        break;
        }
    }
}

// Função principal de sincronização
export async function syncAll(_userId: string, processQueueItem: (item: any) => Promise<boolean>, _lastSync: number | null = null) {
    await syncFromServer();
    await syncToServer(processQueueItem);
}

// Função para buscar tickets pendentes de sync
async function getTicketsPendingSync() {
  const db = await openDatabase();
  const res = await db.executeSql('SELECT * FROM tickets WHERE isSynced = 0');
  if (res[0] && res[0].rows && res[0].rows.length > 0) {
    return res[0].rows.raw();
  }
  return [];
}

// Função para atualizar status de sync local
async function updateTicketStatusLocal(ticketId: string, patch: Partial<any>) {
  const db = await openDatabase();
  const fields = Object.keys(patch).map(k => `${k} = ?`).join(', ');
  const values = Object.values(patch);
  await db.executeSql(`UPDATE tickets SET ${fields} WHERE id = ?`, [...values, ticketId]);
}

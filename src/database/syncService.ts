// src/database/syncService.ts
// Serviço de sincronização bidirecional entre API e SQLite
import { openDatabase } from './db';
import { initDatabase, resetLocalDatabase } from './init';
import { getUserSales } from '../services/saleService';
import { Sale } from '../services/saleService';
import { getUserProfile } from '../services/userService';
// import { setTicketUsed, setTicketUnused } from './ticketService.extra';

// Controle de sincronização para evitar execuções múltiplas
let isSyncing = false;
let lastSyncTime = 0;
const SYNC_COOLDOWN = 30000; // 30 segundos entre sincronizações

// Contador de falhas consecutivas do banco
let consecutiveDbFailures = 0;
const MAX_DB_FAILURES = 2; // Após 2 falhas consecutivas, reseta o banco
let dbCorrupted = false; // Flag para indicar se banco está corrompido

// Função para resetar o banco quando corrompido
async function resetCorruptedDatabase() {
  console.log('[syncService] BANCO CORROMPIDO - Iniciando reset completo...');
  try {
    await resetLocalDatabase();
    await initDatabase();
    consecutiveDbFailures = 0; // Reset do contador
    console.log('[syncService] Reset do banco concluído com sucesso');
    return true;
  } catch (error) {
    console.error('[syncService] ERRO CRÍTICO - Falha ao resetar banco:', error);
    return false;
  }
}

// Função para executar operações de banco com retry e tratamento de erro
async function safeDbOperation<T>(operation: () => T, maxRetries = 3): Promise<T | null> {
  let operationFailed = false;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = operation();

      // Se chegou aqui, operação teve sucesso
      if (!operationFailed) {
        consecutiveDbFailures = 0; // Reset contador apenas se operação toda teve sucesso
      }
      return result;
    } catch (error: any) {
      console.log(`[syncService] Tentativa ${attempt}/${maxRetries} falhou:`, error?.message || error);
      operationFailed = true;

      // Se é NullPointerException ou erro de prepare, tenta novamente
      if (error?.message?.includes('NullPointerException') ||
          error?.message?.includes('prepareSync') ||
          error?.message?.includes('Call to function')) {

        if (attempt < maxRetries) {
          // Aguarda um pouco antes de tentar novamente
          const delay = attempt * 500; // 500ms, 1000ms, 1500ms
          console.log(`[syncService] Aguardando ${delay}ms antes de tentar novamente...`);

          // Implementação simples de delay síncrono
          const start = Date.now();
          while (Date.now() - start < delay) {
            // Busy wait
          }
          continue;
        }
      }

      // Se chegou aqui, todas as tentativas falharam
      console.error(`[syncService] Todas as ${maxRetries} tentativas falharam:`, error);

      // Incrementa contador apenas quando operação completa falha
      consecutiveDbFailures++;

      // Se muitas falhas consecutivas, reseta o banco
      if (consecutiveDbFailures >= MAX_DB_FAILURES) {
        console.error(`[syncService] ATENÇÃO! ${consecutiveDbFailures} operações falharam consecutivamente!`);
        console.error('[syncService] BANCO MARCADO COMO CORROMPIDO - Sincronização DESABILITADA');
        console.error('[syncService] Para reativar, chame forceResetDatabase() ou reinicie o app');

        dbCorrupted = true; // Marca banco como corrompido

        // Tenta reset automático uma vez
        const resetSuccess = await resetCorruptedDatabase();
        if (resetSuccess) {
          console.log('[syncService] Reset automático realizado - tentando operação novamente...');
          dbCorrupted = false; // Remove flag se reset funcionou
          try {
            const result = operation();
            return result;
          } catch (resetError) {
            console.error('[syncService] Falha mesmo após reset automático:', resetError);
            dbCorrupted = true; // Reativa flag se ainda falhar
          }
        }
      }

      return null;
    }
  }
  return null;
}

// Busca atualizações do servidor e atualiza o SQLite
export async function syncFromServer() {
  // Verifica se banco está marcado como corrompido
  if (dbCorrupted) {
    console.log('[syncService] BANCO CORROMPIDO - Sincronização desabilitada. Use forceResetDatabase() para corrigir.');
    return;
  }

  // Verifica se já está sincronizando ou se foi sincronizado recentemente
  const now = Date.now();
  if (isSyncing) {
    console.log('[syncService] Sincronização já em andamento, ignorando...');
    return;
  }

  if (now - lastSyncTime < SYNC_COOLDOWN) {
    console.log('[syncService] Sincronização realizada recentemente, ignorando...');
    return;
  }

  isSyncing = true;
  lastSyncTime = now;  try {
    console.log('[syncService] Iniciando sincronização...');
    // Busca vendas/ingressos do usuário na API
    const sales: Sale[] = await getUserSales();
    // Busca o profile do usuário autenticado
    const profile = await getUserProfile();
    const buyer_name = profile?.name || '';
    const buyer_email = profile?.email || '';
    const buyer_phone = profile?.cellphone || profile?.phone || '';


    // Tenta abrir conexão de banco com retry
    const db = await safeDbOperation(() => openDatabase());
    if (!db) {
      console.error('[syncService] Falha ao abrir conexão com banco de dados após múltiplas tentativas');
      return;
    }    const insertedTicketIds: string[] = [];
    const errorTickets: {ticketId: string, eventId: string, error: any}[] = [];
    const processedEvents = new Set<string>(); // Para evitar inserir o mesmo evento múltiplas vezes

    for (const sale of sales) {
        const eventId = sale.ticket.id;
        const ticketId = sale.id;
        // Não existe campo code real, usa ticketId como code
        const ticketCode = ticketId;

        try {
            // Só insere o evento se ainda não foi processado
            if (!processedEvents.has(eventId)) {
                console.log('[syncService] Inserindo evento:', eventId, sale.ticket.title);
                const eventInsertResult = await safeDbOperation(() => {
                    return db.runSync(
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
                });

                if (eventInsertResult !== null) {
                    processedEvents.add(eventId);
                    console.log('[syncService] Evento inserido OK:', eventId);
                } else {
                    console.error('[syncService] Falha ao inserir evento após múltiplas tentativas:', eventId);
                    continue; // Pula para o próximo sale
                }
            }            const ticketValues = [
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

            console.log('[syncService] Inserindo ticket:', ticketId);
            const ticketInsertResult = await safeDbOperation(() => {
                return db.runSync(
                    `INSERT OR REPLACE INTO tickets (id, event_id, type, code, used, qrCodeUrl, pdfUrl, qrCodeDataUrl, buyer_name, buyer_email, buyer_phone, boughtAt, price, last_updated, isSynced)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                    ticketValues
                );
            });

            if (ticketInsertResult !== null) {
                console.log('[syncService] Ticket inserido OK:', ticketId);
                insertedTicketIds.push(ticketId);
            } else {
                console.error('[syncService] Falha ao inserir ticket após múltiplas tentativas:', ticketId);
                errorTickets.push({ticketId, eventId, error: 'Falha na inserção após múltiplas tentativas'});
            }        } catch (err) {
            console.error('[syncService] ERRO ao inserir:', { ticketId, eventId, error: err });
            errorTickets.push({ticketId, eventId, error: err});
        }
    }

    // Log detalhado dos ingressos após sync
    try {
        // Removido temporariamente para evitar NullPointerException
        // await logAllTicketsWithValidation();
        console.log('[syncService] Sincronização concluída com sucesso');
    } catch (error) {
        console.error('[syncService] DEBUG: Erro ao verificar dados:', error);
    }

    // Após atualizar tickets locais com dados do backend, sincroniza pendências offline
    // TEMPORARIAMENTE DESABILITADO PARA DEBUGAR NullPointerException
    /*
    try {
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
                console.log('[syncService] Erro ao sincronizar ticket pendente:', (ticket as any).id);
            }
        }
    } catch (error) {
        console.log('[syncService] Erro ao buscar tickets pendentes:', error);
    }
    */
    console.log('[syncService] Sincronização concluída com sucesso');
  } catch (error) {
    console.error('[syncService] Erro durante sincronização:', error);
  } finally {
    isSyncing = false;
  }
}

// Força uma sincronização (ignora cooldown)
export async function forceSyncFromServer() {
  isSyncing = false; // Reset do flag
  lastSyncTime = 0; // Reset do tempo
  dbCorrupted = false; // Remove flag de corrupção
  return await syncFromServer();
}
export async function syncToServer(_processQueueItem: (item: any) => Promise<boolean>) {
    // TEMPORARIAMENTE DESABILITADO PARA DEBUGAR NullPointerException
    console.log('[syncService] syncToServer temporariamente desabilitado');
    return;
    /*
    const db = safeDbOperation(() => openDatabase());
    if (!db) {
        console.error('[syncService] Falha ao abrir banco para syncToServer');
        return;
    }

    try {
        const items = safeDbOperation(() => db.getAllSync('SELECT * FROM sync_queue ORDER BY timestamp ASC'));
        if (!items) {
            console.log('[syncService] Falha ao buscar items da sync_queue');
            return;
        }

        for (const item of items) {
            try {
            const ok = await processQueueItem(item);
            if (ok) {
                safeDbOperation(() => db.runSync('DELETE FROM sync_queue WHERE id = ?', [(item as any).id]));
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
    */
}// Função principal de sincronização
export async function syncAll(_userId: string, processQueueItem: (item: any) => Promise<boolean>, _lastSync: number | null = null) {
    await syncFromServer();
    await syncToServer(processQueueItem);
}

// Função para buscar tickets pendentes de sync
async function getTicketsPendingSync() {
  try {
    const db = await safeDbOperation(() => openDatabase());
    if (!db) {
      return [];
    }

    const result = await safeDbOperation(() => db.getAllSync('SELECT * FROM tickets WHERE isSynced = 0'));
    return result || [];
  } catch (error) {
    console.log('[syncService] Erro ao buscar tickets pendentes (normal se primeira vez):', error);
    return [];
  }
}// Função para atualizar status de sync local
async function updateTicketStatusLocal(ticketId: string, patch: Partial<any>) {
  try {
    const db = await safeDbOperation(() => openDatabase());
    if (!db) {
      return;
    }

    const fields = Object.keys(patch).map(k => `${k} = ?`).join(', ');
    const values = Object.values(patch);

    await safeDbOperation(() => db.runSync(`UPDATE tickets SET ${fields} WHERE id = ?`, [...values, ticketId]));
  } catch (error) {
    console.log('[syncService] Erro ao atualizar status do ticket:', ticketId);
  }
}

// Função pública para forçar reset do banco (para usar em emergências)
export async function forceResetDatabase() {
  console.log('[syncService] RESET FORÇADO DO BANCO - Iniciando...');
  consecutiveDbFailures = 0; // Reset contador
  dbCorrupted = false; // Remove flag de corrupção
  const success = await resetCorruptedDatabase();
  if (success) {
    console.log('[syncService] Reset forçado concluído com sucesso - Sincronização reativada');
    // Após reset, tenta sincronizar novamente
    return await forceSyncFromServer();
  } else {
    console.error('[syncService] Falha no reset forçado');
    dbCorrupted = true; // Reativa flag se reset falhar
    return false;
  }
}

// Função para verificar status do banco
export function getDatabaseStatus() {
  return {
    isCorrupted: dbCorrupted,
    consecutiveFailures: consecutiveDbFailures,
    maxFailures: MAX_DB_FAILURES,
    isSyncing: isSyncing,
    lastSyncTime: lastSyncTime,
    syncCooldown: SYNC_COOLDOWN,
  };
}

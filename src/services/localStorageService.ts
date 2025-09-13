import * as SQLite from 'expo-sqlite';
import { Sale } from './saleService';

export interface LocalTicket {
  id: string;
  event_id: string;
  type: string;
  code: string;
  used: boolean;
  qrCodeUrl: string;
  pdfUrl: string;
  qrCodeDataUrl: string;
  eventDate: string;
  eventTitle: string;
  eventDescription: string;
  eventImageUrl: string;
  eventDisplayDate: string;
  eventDisplayTime: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  boughtAt: string;
  price: number;
  createdAt: string;
  pendingSync?: boolean;
  syncedAt?: string;
}

class LocalStorageService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    if (this.db) {
      return;
    }

    this.db = await SQLite.openDatabaseAsync('apaeventus.db');

    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        type TEXT NOT NULL,
        code TEXT NOT NULL UNIQUE,
        used INTEGER DEFAULT 0,
        qrCodeUrl TEXT,
        pdfUrl TEXT,
        qrCodeDataUrl TEXT,
        eventDate TEXT NOT NULL,
        eventTitle TEXT NOT NULL,
        eventDescription TEXT,
        eventImageUrl TEXT,
        eventDisplayDate TEXT,
        eventDisplayTime TEXT,
        buyer_name TEXT NOT NULL,
        buyer_email TEXT NOT NULL,
        buyer_phone TEXT,
        boughtAt TEXT NOT NULL,
        price REAL DEFAULT 0,
        createdAt TEXT NOT NULL,
        pendingSync INTEGER DEFAULT 0,
        syncedAt TEXT,
        UNIQUE(id, event_id)
      );
    `);

    // Criar índices para melhor performance
    await this.db.execAsync(`
      CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
      CREATE INDEX IF NOT EXISTS idx_tickets_buyer_email ON tickets(buyer_email);
      CREATE INDEX IF NOT EXISTS idx_tickets_code ON tickets(code);
    `);
  }

  async saveTickets(sales: Sale[], userProfile: any): Promise<void> {
    await this.init();
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const buyer_name = userProfile?.name || '';
    const buyer_email = userProfile?.email || '';
    const buyer_phone = userProfile?.cellphone || userProfile?.phone || '';

    for (const sale of sales) {
      const eventDate = new Date(sale.ticket.eventDate);
      const eventDisplayDate = eventDate.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const eventDisplayTime = eventDate.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      const localTicket: LocalTicket = {
        id: sale.id,
        event_id: sale.ticket.id,
        type: sale.ticket.title || '',
        code: sale.id,
        used: sale.used,
        qrCodeUrl: sale.qrCodeUrl || '',
        pdfUrl: sale.pdfUrl || '',
        qrCodeDataUrl: sale.qrCodeDataUrl || '',
        eventDate: sale.ticket.eventDate,
        eventTitle: sale.ticket.title || '',
        eventDescription: sale.ticket.description || '',
        eventImageUrl: sale.ticket.imageUrl || '',
        eventDisplayDate,
        eventDisplayTime,
        buyer_name,
        buyer_email,
        buyer_phone,
        boughtAt: sale.createdAt || '',
        price: sale.ticket.price || 0,
        createdAt: new Date().toISOString(),
        pendingSync: false,
        syncedAt: new Date().toISOString(),
      };

      // Insert or replace
      await this.db.runAsync(
        `INSERT OR REPLACE INTO tickets (
          id, event_id, type, code, used, qrCodeUrl, pdfUrl, qrCodeDataUrl,
          eventDate, eventTitle, eventDescription, eventImageUrl,
          eventDisplayDate, eventDisplayTime, buyer_name, buyer_email, buyer_phone,
          boughtAt, price, createdAt, pendingSync, syncedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          localTicket.id,
          localTicket.event_id,
          localTicket.type,
          localTicket.code,
          localTicket.used ? 1 : 0,
          localTicket.qrCodeUrl,
          localTicket.pdfUrl,
          localTicket.qrCodeDataUrl,
          localTicket.eventDate,
          localTicket.eventTitle,
          localTicket.eventDescription,
          localTicket.eventImageUrl,
          localTicket.eventDisplayDate,
          localTicket.eventDisplayTime,
          localTicket.buyer_name,
          localTicket.buyer_email,
          localTicket.buyer_phone,
          localTicket.boughtAt,
          localTicket.price,
          localTicket.createdAt,
          localTicket.pendingSync ? 1 : 0,
          localTicket.syncedAt || '',
        ]
      );
    }
  }

  async getLocalTickets(): Promise<LocalTicket[]> {
    await this.init();
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const result = await this.db.getAllAsync(
      'SELECT * FROM tickets ORDER BY eventDate DESC'
    );

    return result.map((row: any) => ({
      ...row,
      used: row.used === 1,
      pendingSync: row.pendingSync === 1,
    }));
  }

  async getTicketsByEvent(eventId: string): Promise<LocalTicket[]> {
    await this.init();
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const result = await this.db.getAllAsync(
      'SELECT * FROM tickets WHERE event_id = ? ORDER BY boughtAt ASC',
      [eventId]
    );

    return result.map((row: any) => ({
      ...row,
      used: row.used === 1,
      pendingSync: row.pendingSync === 1,
    }));
  }

  async markTicketAsUsed(ticketId: string, used: boolean = true): Promise<void> {
    await this.init();
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    await this.db.runAsync(
      'UPDATE tickets SET used = ?, pendingSync = 1 WHERE id = ?',
      [used ? 1 : 0, ticketId]
    );
  }

  async getGroupedTickets(): Promise<any[]> {
    const tickets = await this.getLocalTickets();

    // Agrupa os ingressos por evento
    const groupedMap: { [eventId: string]: any } = {};

    for (const ticket of tickets) {
      if (!groupedMap[ticket.event_id]) {
        groupedMap[ticket.event_id] = {
          event: {
            id: ticket.event_id,
            title: ticket.eventTitle,
            date: ticket.eventDate.split('T')[0],
            time: ticket.eventDate.split('T')[1]?.slice(0, 5) || '',
            location: ticket.eventDescription,
            imageUrl: ticket.eventImageUrl,
            displayDate: ticket.eventDisplayDate,
            displayTime: ticket.eventDisplayTime,
          },
          tickets: [],
        };
      }

      groupedMap[ticket.event_id].tickets.push({
        id: ticket.id,
        event_id: ticket.event_id,
        type: ticket.type,
        code: ticket.code,
        used: ticket.used,
        qrCodeUrl: ticket.qrCodeUrl,
        pdfUrl: ticket.pdfUrl,
        qrCodeDataUrl: ticket.qrCodeDataUrl,
        buyer_name: ticket.buyer_name,
        buyer_email: ticket.buyer_email,
        buyer_phone: ticket.buyer_phone,
        boughtAt: ticket.boughtAt,
        price: ticket.price,
        pendingSync: ticket.pendingSync,
      });
    }

    // Mapeia para array e ordena por data
    const groupedArr = Object.values(groupedMap);
    groupedArr.sort((a: any, b: any) => {
      const dateA = new Date(`${a.event.date}${a.event.time ? 'T' + a.event.time : ''}`).getTime();
      const dateB = new Date(`${b.event.date}${b.event.time ? 'T' + b.event.time : ''}`).getTime();
      return dateB - dateA;
    });

    return groupedArr;
  }

  async clearAllTickets(): Promise<void> {
    await this.init();
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    await this.db.runAsync('DELETE FROM tickets');
  }

  async syncPendingChanges(): Promise<LocalTicket[]> {
    await this.init();
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const result = await this.db.getAllAsync(
      'SELECT * FROM tickets WHERE pendingSync = 1'
    );

    return result.map((row: any) => ({
      ...row,
      used: row.used === 1,
      pendingSync: row.pendingSync === 1,
    }));
  }

  async markTicketAsSynced(ticketId: string): Promise<void> {
    await this.init();
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    await this.db.runAsync(
      'UPDATE tickets SET pendingSync = 0, syncedAt = ? WHERE id = ?',
      [new Date().toISOString(), ticketId]
    );
  }

  async hasLocalTickets(): Promise<boolean> {
    await this.init();
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const result = await this.db.getFirstAsync(
      'SELECT COUNT(*) as count FROM tickets'
    );

    return (result as any)?.count > 0;
  }
}

export const localStorageService = new LocalStorageService();

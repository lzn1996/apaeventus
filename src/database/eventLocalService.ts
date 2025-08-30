import { openDatabase } from './db';

export async function initEventTable() {
    const db = openDatabase();
    db.runSync(`
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
}

export async function saveLocalEvent(event: {
    id?: string;
    title: string;
    date: string;
    quantity?: number;
    price?: number;
    imageUri?: string;
}) {
    const db = openDatabase();
    const id = event.id || String(Date.now());
    db.runSync(
        `INSERT OR REPLACE INTO events (id, title, date, quantity, price, imageUri, last_updated)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
            id,
            event.title,
            event.date,
            event.quantity || 0,
            event.price || 0,
            event.imageUri || '',
            Date.now(),
        ]
    );
}

export async function getAllEvents() {
    const db = openDatabase();
    const res = db.getAllSync('SELECT * FROM events ORDER BY date DESC');
    return res;
}

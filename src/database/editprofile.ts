// src/database/editprofile.ts
import { openDatabase } from './db';

export function initProfileTable(): void {
  const db = openDatabase();
  db.runSync(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT,
      email TEXT,
      rg TEXT,
      cellphone TEXT
    );
  `);
}

export function getLocalProfile(
  cb: (row: { name: string; email: string; rg: string; cellphone: string } | null) => void
): void {
  const db = openDatabase();
  try {
    const result = db.getAllSync('SELECT * FROM user_profile WHERE id = 1;');
    const item = result.length > 0 ? result[0] as any : null;
    cb(item);
  } catch (error) {
    console.error('[getLocalProfile] Erro:', error);
    cb(null);
  }
}

export function saveLocalProfile(data: {
  name: string;
  email: string;
  rg: string;
  cellphone: string;
}): void {
  const db = openDatabase();
  try {
    db.runSync(
      `REPLACE INTO user_profile (id, name, email, rg, cellphone)
       VALUES (1, ?, ?, ?, ?);`,
      [data.name, data.email, data.rg, data.cellphone]
    );
  } catch (error) {
    console.error('[saveLocalProfile] Erro:', error);
  }
}

export function initEventTable(): void {
  const db = openDatabase();
  db.runSync(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      date TEXT,
      quantity INTEGER,
      price REAL,
      imageUri TEXT
    );
  `);
}

export function saveLocalEvent(data: {
  title: string;
  description: string;
  date: string;
  quantity: number;
  price: number;
  imageUri?: string;
}): void {
  const db = openDatabase();
  try {
    db.runSync(
      `INSERT INTO events (title, description, date, quantity, price, imageUri)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [data.title, data.description, data.date, data.quantity, data.price, data.imageUri || '']
    );
  } catch (error) {
    console.error('[saveLocalEvent] Erro:', error);
  }
}

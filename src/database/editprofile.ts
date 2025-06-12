// src/database/editprofile.ts
import { db } from './db';
import { Transaction, ResultSet } from 'react-native-sqlite-storage';

export function initProfileTable(): void {
  db.transaction(tx => {
    tx.executeSql(`
      CREATE TABLE IF NOT EXISTS user_profile (
        id INTEGER PRIMARY KEY NOT NULL,
        name TEXT,
        email TEXT,
        rg TEXT,
        cellphone TEXT
      );
    `);
  });
}

export function getLocalProfile(
  cb: (row: { name: string; email: string; rg: string; cellphone: string } | null) => void
): void {
  db.transaction(tx => {
    tx.executeSql(
      'SELECT * FROM user_profile WHERE id = 1;',
      [],
      (_tx, result: ResultSet) => {
        const item = result.rows.length > 0
          ? result.rows.item(0)
          : null;
        cb(item);
      }
    );
  });
}

export function saveLocalProfile(data: {
  name: string;
  email: string;
  rg: string;
  cellphone: string;
}): void {
  db.transaction(tx => {
    tx.executeSql(
      `REPLACE INTO user_profile (id, name, email, rg, cellphone)
       VALUES (1, ?, ?, ?, ?);`,
      [data.name, data.email, data.rg, data.cellphone]
    );
  });
}

export function initEventTable(): void {
  db.transaction(tx => {
    tx.executeSql(`
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
  });
}

export function saveLocalEvent(data: {
  title: string;
  description: string;
  date: string;
  quantity: number;
  price: number;
  imageUri?: string;
}): void {
  db.transaction(tx => {
    tx.executeSql(
      `INSERT INTO events (title, description, date, quantity, price, imageUri)
       VALUES (?, ?, ?, ?, ?, ?);`,
      [data.title, data.description, data.date, data.quantity, data.price, data.imageUri || '']
    );
  });
}

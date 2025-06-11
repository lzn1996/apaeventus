import SQLite, { SQLiteDatabase, Transaction, ResultSet } 
  from 'react-native-sqlite-storage';


const db: SQLiteDatabase = SQLite.openDatabase({ name: 'app.db', location: 'default' });

export function initProfileTable(): void {
  db.transaction((tx: Transaction) => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS user_profile (
         id INTEGER PRIMARY KEY NOT NULL,
         name TEXT,
         email TEXT,
         rg TEXT,
         cellphone TEXT
       );`
    );
  });
}

export function getLocalProfile(
  cb: (row: { name: string; email: string; rg: string; cellphone: string } | null) => void
): void {
db.transaction(tx => {
  tx.executeSql(
    'SELECT …',
    [],
    (_tx, result: ResultSet) => {
      const rows = result.rows // → aqui rows é any-array-like
      const item = rows.length > 0 ? rows.item(0) : null;
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
  db.transaction((tx: Transaction) => {
    tx.executeSql(
      'REPLACE INTO user_profile (id, name, email, rg, cellphone) VALUES (1, ?, ?, ?, ?);',
      [data.name, data.email, data.rg, data.cellphone]
    );
  });

}

export function initEventTable(): void {
  db.transaction(tx => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS events (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         title TEXT,
         description TEXT,
         date TEXT,
         quantity INTEGER,
         price REAL,
         imageUri TEXT
       );`,
      [],
      () => console.log('events READY'),
      (_tx, err) => { console.error(err); return true; }
    );
  });
}

// ** NOVO: salvar um evento localmente **
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
      [data.title, data.description, data.date, data.quantity, data.price, data.imageUri || ''],
      () => console.log('Evento salvo localmente'),
      (_tx, err) => { console.error(err); return true; }
    );
  });
}

// ** opcional: ler todos os eventos **
export function getLocalEvents(
  cb: (rows: Array<{ id: number; title: string; /*…*/ }>) => void
): void {
  db.transaction(tx => {
    tx.executeSql(
      `SELECT * FROM events ORDER BY date DESC;`,
      [],
      (_tx, result: ResultSet) => {
        const len = result.rows.length;
        const arr: any[] = [];
        for (let i = 0; i < len; i++) arr.push(result.rows.item(i));
        cb(arr);
      },
      (_tx, err) => { console.error(err); return true; }
    );
  });
}
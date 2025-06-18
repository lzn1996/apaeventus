// src/database/db.ts
import SQLite, { Transaction, ResultSet } from 'react-native-sqlite-storage';

// Troque para true quando quiser usar o banco de verdade
const USE_DB = false;

type DbMock = {
  transaction: (cb: (tx: Transaction) => void) => void;
};

const dbMock: DbMock = {
  transaction: cb => {
    const txStub = {
      executeSql: (
        _sql: string,
        _params: any[] = [],
        success: (tx: Transaction, rs: ResultSet) => void = () => {},
        _error: (tx: Transaction, err: any) => boolean = () => true
      ) => {
        success(
          txStub as unknown as Transaction,
          { rows: { length: 0, item: (_i: number) => ({}) } } as unknown as ResultSet
        );
      }
    } as unknown as Transaction;
    cb(txStub);
  }
};

export const db = USE_DB
  ? (SQLite.openDatabase({ name: 'app.db', location: 'default' }) as SQLite.SQLiteDatabase)
  : (dbMock as unknown as SQLite.SQLiteDatabase);

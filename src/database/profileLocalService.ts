import { openDatabase } from './db';

// Adiciona suporte ao campo 'rg' no perfil local
export async function saveUserProfileLocal(profile: { id: string, name: string, email: string, cellphone?: string, phone?: string, rg?: string }) {
    const db = await openDatabase();
    await db.executeSql(
        'INSERT OR REPLACE INTO user_profile (id, name, email, cellphone, phone, rg) VALUES (?, ?, ?, ?, ?, ?)',
        [
            profile.id,
            profile.name,
            profile.email,
            profile.cellphone || '',
            profile.phone || '',
            profile.rg || '',
        ]
    );
}

export async function getUserProfileLocal() {
    const db = await openDatabase();
    const res = await db.executeSql('SELECT * FROM user_profile LIMIT 1');
    if (res[0].rows.length > 0) {
        return res[0].rows.item(0);
    }
    return null;
}

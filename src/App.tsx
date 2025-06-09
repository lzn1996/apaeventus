import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { initDatabase } from './database/init';
import { syncAll } from './database/syncService';

export default function App() {
    useEffect(() => {
        async function start() {
            await initDatabase();
            // Chama syncAll ao abrir o app (dummy processQueueItem)
            await syncAll('', async () => true);
        }
        start();
    }, []);

    return (
        <View style={styles.container}>
            <Text>Open up App.tsx to start working on your app!</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
});

import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
    useEffect(() => {
        // Inicialização removida - sem SQLite
        console.log('App iniciado sem SQLite');
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

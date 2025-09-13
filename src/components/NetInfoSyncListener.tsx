import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NetInfoSyncListener() {
    useEffect(() => {
        let unsubscribe: (() => void) | null = null;

        const setupNetInfoListener = async () => {
            const accessToken = await AsyncStorage.getItem('accessToken');
            const userRole = await AsyncStorage.getItem('userRole');
            if (accessToken && userRole) {
                unsubscribe = NetInfo.addEventListener(state => {
                    if (state.isConnected) {
                        // Sincronização removida - agora usa apenas servidor
                        console.log('Conectado à internet');
                    }
                });
            }
        };

        setupNetInfoListener();

        return () => {
            if (unsubscribe) { unsubscribe(); }
        };
    }, []);

    return null;
}

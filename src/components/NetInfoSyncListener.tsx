import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { syncAll } from '../database/syncService';

export default function NetInfoSyncListener() {
    useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const setupNetInfoListener = async () => {
        const accessToken = await AsyncStorage.getItem('accessToken');
        const userRole = await AsyncStorage.getItem('userRole');
        if (accessToken && userRole) {
            unsubscribe = NetInfo.addEventListener(state => {
            if (state.isConnected) {
                syncAll('', async () => true);
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

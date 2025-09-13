import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { localStorageService } from '../services/localStorageService';
import { getUserSales } from '../services/saleService';
import { getUserProfile } from '../services/userService';

export interface OfflineHookState {
  isConnected: boolean;
  hasLocalData: boolean;
  loading: boolean;
  error: string | null;
  lastSyncDate: Date | null;
}

export const useOfflineTickets = () => {
  const [state, setState] = useState<OfflineHookState>({
    isConnected: true,
    hasLocalData: false,
    loading: true,
    error: null,
    lastSyncDate: null,
  });

  // Verifica se há dados locais
  const checkLocalData = useCallback(async () => {
    try {
      const hasData = await localStorageService.hasLocalTickets();
      setState(prev => ({ ...prev, hasLocalData: hasData }));
      return hasData;
    } catch (error) {
      console.error('Erro ao verificar dados locais:', error);
      return false;
    }
  }, []);

  // Sincroniza dados quando há conexão
  const syncTickets = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // Busca dados da API
      const [sales, userProfile] = await Promise.all([
        getUserSales(),
        getUserProfile(),
      ]);

      // Salva no banco local
      await localStorageService.saveTickets(sales, userProfile);

      setState(prev => ({
        ...prev,
        hasLocalData: true,
        lastSyncDate: new Date(),
        loading: false,
      }));

      console.log('Ingressos sincronizados com sucesso');
      return true;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        error: 'Erro ao sincronizar ingressos',
        loading: false,
      }));
      return false;
    }
  }, []);

  // Busca ingressos locais
  const getLocalTickets = useCallback(async () => {
    try {
      return await localStorageService.getGroupedTickets();
    } catch (error) {
      console.error('Erro ao buscar ingressos locais:', error);
      setState(prev => ({
        ...prev,
        error: 'Erro ao carregar ingressos locais',
      }));
      return [];
    }
  }, []);

  // Busca ingressos por evento
  const getTicketsByEvent = useCallback(async (eventId: string) => {
    try {
      return await localStorageService.getTicketsByEvent(eventId);
    } catch (error) {
      console.error('Erro ao buscar ingressos do evento:', error);
      return [];
    }
  }, []);

  // Marca ingresso como usado (offline)
  const markTicketAsUsed = useCallback(async (ticketId: string, used: boolean = true) => {
    try {
      await localStorageService.markTicketAsUsed(ticketId, used);
      return true;
    } catch (error) {
      console.error('Erro ao marcar ingresso:', error);
      return false;
    }
  }, []);

  // Limpa dados locais
  const clearLocalData = useCallback(async () => {
    try {
      await localStorageService.clearAllTickets();
      setState(prev => ({ ...prev, hasLocalData: false }));
      return true;
    } catch (error) {
      console.error('Erro ao limpar dados locais:', error);
      return false;
    }
  }, []);

  // Sincroniza alterações pendentes quando volta a conexão
  const syncPendingChanges = useCallback(async () => {
    if (!state.isConnected) {
      return false;
    }

    try {
      const pendingTickets = await localStorageService.syncPendingChanges();

      // Aqui você pode implementar lógica para enviar as alterações para a API
      // Por exemplo, marcar ingressos como usados no servidor
      for (const ticket of pendingTickets) {
        console.log('Sincronizando alteração pendente:', ticket.id, ticket.used);
        // TODO: Implementar chamada para API para sincronizar estado do ingresso
        await localStorageService.markTicketAsSynced(ticket.id);
      }

      return true;
    } catch (error) {
      console.error('Erro ao sincronizar alterações pendentes:', error);
      return false;
    }
  }, [state.isConnected]);

  // Monitora conexão de rede
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(networkState => {
      const connected = !!networkState.isConnected;
      setState(prev => ({ ...prev, isConnected: connected }));

      // Se reconectou, tenta sincronizar
      if (connected && !state.isConnected) {
        syncPendingChanges();
      }
    });

    return () => unsubscribe();
  }, [state.isConnected, syncPendingChanges]);

  // Inicialização
  useEffect(() => {
    const initialize = async () => {
      await checkLocalData();
      setState(prev => ({ ...prev, loading: false }));
    };

    initialize();
  }, [checkLocalData]);

  return {
    ...state,
    syncTickets,
    getLocalTickets,
    getTicketsByEvent,
    markTicketAsUsed,
    clearLocalData,
    checkLocalData,
    syncPendingChanges,
  };
};

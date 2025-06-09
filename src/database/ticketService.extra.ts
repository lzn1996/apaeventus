import api from '../services/api';

// Conta ingressos vendidos para um ticketId
export async function countSoldTickets(ticketId: string) {
  const res = await api.get(`/ticket/${ticketId}/count-sold`);
  return res.data.count;
}

// Conta ingressos usados para um ticketId
export async function countUsedTickets(ticketId: string) {
  const res = await api.get(`/ticket/${ticketId}/count-used`);
  return res.data.count;
}

// Marca ingresso como usado via API
export async function setTicketUsed(saleId: string) {
  const res = await api.post('/sale/set-used', { saleId });
  return res.data;
}

// Marca ingresso como não usado via API
export async function setTicketUnused(saleId: string) {
  const res = await api.post('/sale/set-unused', { saleId });
  return res.data;
}

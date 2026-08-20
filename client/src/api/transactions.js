import api from './axios';

export const createTransaction = async (items) => {
  const response = await api.post('/transactions', { items });
  return response.data;
};

export const getTransactions = async () => {
  const response = await api.get('/transactions');
  return response.data;
};

export const getTransactionById = async (id) => {
  const response = await api.get(`/transactions/${id}`);
  return response.data;
};

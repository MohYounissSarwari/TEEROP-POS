import api from './axios';

export const getDashboardStatistics = () =>
  api.get('/statistics/dashboard').then((r) => r.data);

export const getSalesStatistics = () =>
  api.get('/statistics/sales').then((r) => r.data);

export const getInventoryStatistics = () =>
  api.get('/statistics/inventory').then((r) => r.data);

import api from './axios';

export const getProducts = async (params = {}) => {
  const response = await api.get('/products', { params });
  return response.data;
};

export const getLowStockProducts = async () => {
  const response = await api.get('/products/low-stock');
  return response.data;
};

export const getProductById = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

export const createProduct = async (data) => {
  const response = await api.post('/products', data);
  return response.data;
};

export const updateProduct = async (id, data) => {
  const response = await api.put(`/products/${id}`, data);
  return response.data;
};

export const restockProduct = async (id, amount) => {
  const response = await api.patch(`/products/${id}/restock`, { amount });
  return response.data;
};

export const deactivateProduct = async (id) => {
  const response = await api.patch(`/products/${id}/deactivate`);
  return response.data;
};

export const uploadProductImage = async (id, file) => {
  const formData = new FormData();
  formData.append('image', file);
  const response = await api.post(`/products/${id}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

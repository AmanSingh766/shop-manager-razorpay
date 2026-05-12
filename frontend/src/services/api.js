import axios from 'axios';

const API_BASE = 'http://localhost:8082/api';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

export const productAPI = {
  getAll: (page = 0, size = 12, search = '') =>
    api.get(`/products?page=${page}&size=${size}${search ? `&search=${search}` : ''}`),
  getOne: (id) => api.get(`/products/${id}`),
  getAllAdmin: (page = 0, size = 12) => api.get(`/admin/products?page=${page}&size=${size}`),
  create: (data) => api.post('/admin/products', data),
  updatePrice: (id, data) => api.patch(`/admin/products/${id}/price`, data),
  updateQuantity: (id, data) => api.patch(`/admin/products/${id}/quantity`, data),
  toggle: (id) => api.patch(`/admin/products/${id}/toggle`),
};

export const cartAPI = {
  get: () => api.get('/cart'),
  addItem: (data) => api.post('/cart/items', data),
  updateItem: (id, data) => api.put(`/cart/items/${id}`, data),
  removeItem: (id) => api.delete(`/cart/items/${id}`),
};

export const orderAPI = {
  // Step 1: create order + get Razorpay order id
  createOrder: (data) => api.post('/orders/create', data),
  // Step 2: verify payment signature + process inventory
  verifyPayment: (data) => api.post('/orders/verify-payment', data),
  myOrders: (page = 0) => api.get(`/orders?page=${page}`),
  getOne: (id) => api.get(`/orders/${id}`),
  // Admin
  allOrders: (page = 0) => api.get(`/admin/orders?page=${page}`),
  updateStatus: (id, status) => api.patch(`/admin/orders/${id}/status?status=${status}`),
};

export default api;

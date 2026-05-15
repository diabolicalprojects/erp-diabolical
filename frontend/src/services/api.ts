import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://erp-back.diabolicalservices.tech/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Intercept requests to add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('erp_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('erp_token');
      localStorage.removeItem('erp_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

// Dashboard
export const dashboardAPI = {
  get: () => api.get('/dashboard'),
};

// Customers
export const customersAPI = {
  getAll: () => api.get('/customers'),
  getOne: (id: string) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: string, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: string) => api.delete(`/customers/${id}`),
};

// Deals
export const dealsAPI = {
  getAll: () => api.get('/deals'),
  getOne: (id: string) => api.get(`/deals/${id}`),
  create: (data: any) => api.post('/deals', data),
  update: (id: string, data: any) => api.put(`/deals/${id}`, data),
  // PRD §4A & §4B — Stage change with validation + event trigger
  patchStage: (id: string, stage: string) => api.patch(`/deals/${id}/stage`, { stage }),
  delete: (id: string) => api.delete(`/deals/${id}`),
};

// Quotes
export const quotesAPI = {
  getAll: () => api.get('/quotes'),
  getOne: (id: string) => api.get(`/quotes/${id}`),
  create: (data: any) => api.post('/quotes', data),
  update: (id: string, data: any) => api.put(`/quotes/${id}`, data),
  delete: (id: string) => api.delete(`/quotes/${id}`),
};

// Inventory
export const inventoryAPI = {
  getAll: () => api.get('/inventory'),
  create: (data: any) => api.post('/inventory', data),
  update: (id: string, data: any) => api.put(`/inventory/${id}`, data),
  delete: (id: string) => api.delete(`/inventory/${id}`),
};

// Purchases
export const purchasesAPI = {
  getAll: () => api.get('/purchases'),
  create: (data: any) => api.post('/purchases', data),
  update: (id: string, data: any) => api.put(`/purchases/${id}`, data),
  delete: (id: string) => api.delete(`/purchases/${id}`),
};

// Vendors
export const vendorsAPI = {
  getAll: () => api.get('/vendors'),
  create: (data: any) => api.post('/vendors', data),
  update: (id: string, data: any) => api.put(`/vendors/${id}`, data),
  delete: (id: string) => api.delete(`/vendors/${id}`),
};

// Receivables
export const receivablesAPI = {
  getAll: () => api.get('/receivables'),
  create: (data: any) => api.post('/receivables', data),
  update: (id: string, data: any) => api.put(`/receivables/${id}`, data),
  registerPayment: (id: string, amount: number) => api.put(`/receivables/${id}`, { paymentAmount: amount }),
  delete: (id: string) => api.delete(`/receivables/${id}`),
};

// Payables
export const payablesAPI = {
  getAll: () => api.get('/payables'),
  create: (data: any) => api.post('/payables', data),
  update: (id: string, data: any) => api.put(`/payables/${id}`, data),
  delete: (id: string) => api.delete(`/payables/${id}`),
};

// Projects
export const projectsAPI = {
  getAll: () => api.get('/projects'),
  create: (data: any) => api.post('/projects', data),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

// Tasks
export const tasksAPI = {
  getAll: () => api.get('/tasks'),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

// Metrics
export const metricsAPI = {
  get: () => api.get('/metrics'),
  // PRD §4C — MongoDB aggregation summary (admin + finanzas only)
  executiveSummary: () => api.get('/metrics/executive-summary'),
};

// Roles
export const rolesAPI = {
  get: () => api.get('/roles'),
  updateRole: (id: string, role: string) => api.put(`/roles/${id}`, { role }),
};

// Settings
export const settingsAPI = {
  getQuote: () => api.get('/settings/quote'),
  updateQuote: (data: any) => api.put('/settings/quote', data),
};

export default api;

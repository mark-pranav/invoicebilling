import api from './axios';

export const fetchInvoices = (params = {}) =>
  api.get('/invoices', { params }).then((r) => r.data);

export const fetchInvoice = (id) =>
  api.get(`/invoices/${id}`).then((r) => r.data);

export const createInvoice = (payload) =>
  api.post('/invoices', payload).then((r) => r.data);

export const updateInvoice = (id, payload) =>
  api.put(`/invoices/${id}`, payload).then((r) => r.data);

export const deleteInvoice = (id) =>
  api.delete(`/invoices/${id}`).then((r) => r.data);

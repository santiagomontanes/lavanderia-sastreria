import { contextBridge, ipcRenderer } from 'electron';
import type { ClientInput, DbConnectionConfig, DeliveryInput, ExternalLinkPayload, LoginInput, OrderInput, PaymentInput } from '../shared/types.js';

contextBridge.exposeInMainWorld('desktopApi', {
  health: () => ipcRenderer.invoke('app:health'),
  openExternal: (payload: ExternalLinkPayload) => ipcRenderer.invoke('app:open-external', payload),
  saveDbConfig: (config: DbConnectionConfig) => ipcRenderer.invoke('db:save-config', config),
  login: (input: LoginInput) => ipcRenderer.invoke('auth:login', input),
  getCompanySettings: () => ipcRenderer.invoke('settings:company'),
  listClients: () => ipcRenderer.invoke('clients:list'),
  createClient: (input: ClientInput) => ipcRenderer.invoke('clients:create', input),
  updateClient: (id: number, input: ClientInput) => ipcRenderer.invoke('clients:update', id, input),
  deleteClient: (id: number) => ipcRenderer.invoke('clients:delete', id),
  listOrders: () => ipcRenderer.invoke('orders:list'),
  getOrderDetail: (id: number) => ipcRenderer.invoke('orders:detail', id),
  getOrderCatalogs: () => ipcRenderer.invoke('orders:catalogs'),
  createOrder: (input: OrderInput) => ipcRenderer.invoke('orders:create', input),
  listPayments: (orderId?: number) => ipcRenderer.invoke('payments:list', orderId),
  createPayment: (input: PaymentInput) => ipcRenderer.invoke('payments:create', input),
  listInvoices: () => ipcRenderer.invoke('invoices:list'),
  getInvoiceDetail: (id: number) => ipcRenderer.invoke('invoices:detail', id),
  createInvoiceFromOrder: (orderId: number) => ipcRenderer.invoke('invoices:create-from-order', orderId),
  openCashSession: (openingAmount: number) => ipcRenderer.invoke('cash:open', openingAmount),
  getCashSummary: () => ipcRenderer.invoke('cash:summary'),
  listDeliveries: () => ipcRenderer.invoke('deliveries:list'),
  createDelivery: (input: DeliveryInput) => ipcRenderer.invoke('deliveries:create', input),
  getDashboardSummary: () => ipcRenderer.invoke('dashboard:summary')
});

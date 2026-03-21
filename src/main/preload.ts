import { contextBridge, ipcRenderer } from 'electron';
import type { ClientInput, DbConnectionConfig, LoginInput, OrderInput } from '../shared/types.js';

contextBridge.exposeInMainWorld('desktopApi', {
  health: () => ipcRenderer.invoke('app:health'),
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
  getDashboardSummary: () => ipcRenderer.invoke('dashboard:summary')
});

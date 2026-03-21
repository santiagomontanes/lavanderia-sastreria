import { ipcMain } from 'electron';
import { databaseManager } from '../services/database-manager.js';
import { createClientsService } from '../../backend/modules/clients/service.js';
import { createOrdersService } from '../../backend/modules/orders/service.js';
import { createSettingsService } from '../../backend/modules/settings/service.js';
import { createAuthService } from '../../backend/modules/auth/service.js';
import type { ClientInput, DbConnectionConfig, LoginInput, OrderInput } from '../../shared/types.js';

const wrap = <TArgs extends unknown[], TResult>(handler: (...args: TArgs) => Promise<TResult>) => async (_event: unknown, ...args: TArgs) => {
  try {
    const data = await handler(...args);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Error inesperado.' };
  }
};

export const registerIpc = () => {
  ipcMain.handle('app:health', wrap(async () => databaseManager.healthCheck()));
  ipcMain.handle('db:save-config', wrap(async (config: DbConnectionConfig) => {
    await databaseManager.saveConfig(config);
    await databaseManager.migrate();
    return databaseManager.healthCheck();
  }));
  ipcMain.handle('auth:login', wrap(async (input: LoginInput) => createAuthService(await databaseManager.getDb()).login(input)));
  ipcMain.handle('settings:company', wrap(async () => createSettingsService(await databaseManager.getDb()).getCompanySettings()));
  ipcMain.handle('clients:list', wrap(async () => createClientsService(await databaseManager.getDb()).list()));
  ipcMain.handle('clients:create', wrap(async (input: ClientInput) => createClientsService(await databaseManager.getDb()).create(input)));
  ipcMain.handle('clients:update', wrap(async (id: number, input: ClientInput) => createClientsService(await databaseManager.getDb()).update(id, input)));
  ipcMain.handle('clients:delete', wrap(async (id: number) => createClientsService(await databaseManager.getDb()).remove(id)));
  ipcMain.handle('orders:list', wrap(async () => createOrdersService(await databaseManager.getDb()).list()));
  ipcMain.handle('orders:detail', wrap(async (id: number) => createOrdersService(await databaseManager.getDb()).detail(id)));
  ipcMain.handle('orders:create', wrap(async (input: OrderInput) => createOrdersService(await databaseManager.getDb()).create(input)));
  ipcMain.handle('orders:catalogs', wrap(async () => createOrdersService(await databaseManager.getDb()).catalogs()));
  ipcMain.handle('dashboard:summary', wrap(async () => createOrdersService(await databaseManager.getDb()).dashboard()));
};

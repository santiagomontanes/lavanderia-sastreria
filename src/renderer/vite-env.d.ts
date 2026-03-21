/// <reference types="vite/client" />
import type { ClientInput, DbConnectionConfig, LoginInput, OrderInput } from '@shared/types';

declare global {
  interface Window {
    desktopApi: {
      health: () => Promise<unknown>;
      saveDbConfig: (config: DbConnectionConfig) => Promise<unknown>;
      login: (input: LoginInput) => Promise<unknown>;
      getCompanySettings: () => Promise<unknown>;
      listClients: () => Promise<unknown>;
      createClient: (input: ClientInput) => Promise<unknown>;
      updateClient: (id: number, input: ClientInput) => Promise<unknown>;
      deleteClient: (id: number) => Promise<unknown>;
      listOrders: () => Promise<unknown>;
      getOrderDetail: (id: number) => Promise<unknown>;
      getOrderCatalogs: () => Promise<unknown>;
      createOrder: (input: OrderInput) => Promise<unknown>;
      getDashboardSummary: () => Promise<unknown>;
    };
  }
}

export {};

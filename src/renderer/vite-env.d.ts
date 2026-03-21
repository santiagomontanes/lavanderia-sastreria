/// <reference types="vite/client" />
import type { ClientInput, DbConnectionConfig, DeliveryInput, ExternalLinkPayload, LoginInput, OrderInput, PaymentInput } from '@shared/types';

declare global {
  interface Window {
    desktopApi: {
      health: () => Promise<unknown>;
      openExternal: (payload: ExternalLinkPayload) => Promise<unknown>;
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
      listPayments: (orderId?: number) => Promise<unknown>;
      createPayment: (input: PaymentInput) => Promise<unknown>;
      listInvoices: () => Promise<unknown>;
      getInvoiceDetail: (id: number) => Promise<unknown>;
      createInvoiceFromOrder: (orderId: number) => Promise<unknown>;
      openCashSession: (openingAmount: number) => Promise<unknown>;
      getCashSummary: () => Promise<unknown>;
      listDeliveries: () => Promise<unknown>;
      createDelivery: (input: DeliveryInput) => Promise<unknown>;
      getDashboardSummary: () => Promise<unknown>;
    };
  }
}

export {};

import type { ApiResponse, CashSessionSummary, CatalogsPayload, Client, ClientInput, CompanySettings, DashboardSummary, DbConnectionConfig, DeliveryInput, DeliveryRecord, HealthStatus, Invoice, InvoiceDetail, LoginInput, Order, OrderDetail, OrderInput, Payment, PaymentInput, SessionUser } from '@shared/types';

async function unwrap<T>(promise: Promise<unknown>): Promise<T> {
  const response = await promise as ApiResponse<T>;
  if (!response.success) throw new Error(response.error ?? 'Error desconocido.');
  return response.data as T;
}

export const api = {
  health: () => unwrap<HealthStatus>(window.desktopApi.health()),
  openExternal: (url: string) => unwrap(window.desktopApi.openExternal({ url })),
  saveDbConfig: (config: DbConnectionConfig) => unwrap<HealthStatus>(window.desktopApi.saveDbConfig(config)),
  login: (input: LoginInput) => unwrap<SessionUser>(window.desktopApi.login(input)),
  companySettings: () => unwrap<CompanySettings | null>(window.desktopApi.getCompanySettings()),
  listClients: () => unwrap<Client[]>(window.desktopApi.listClients()),
  createClient: (input: ClientInput) => unwrap<Client>(window.desktopApi.createClient(input)),
  updateClient: (id: number, input: ClientInput) => unwrap<Client>(window.desktopApi.updateClient(id, input)),
  deleteClient: (id: number) => unwrap<{ id: number }>(window.desktopApi.deleteClient(id)),
  listOrders: () => unwrap<Order[]>(window.desktopApi.listOrders()),
  orderDetail: (id: number) => unwrap<OrderDetail>(window.desktopApi.getOrderDetail(id)),
  orderCatalogs: () => unwrap<CatalogsPayload>(window.desktopApi.getOrderCatalogs()),
  createOrder: (input: OrderInput) => unwrap<OrderDetail>(window.desktopApi.createOrder(input)),
  listPayments: (orderId?: number) => unwrap<Payment[]>(window.desktopApi.listPayments(orderId)),
  createPayment: (input: PaymentInput) => unwrap<Payment>(window.desktopApi.createPayment(input)),
  listInvoices: () => unwrap<Invoice[]>(window.desktopApi.listInvoices()),
  invoiceDetail: (id: number) => unwrap<InvoiceDetail>(window.desktopApi.getInvoiceDetail(id)),
  createInvoiceFromOrder: (orderId: number) => unwrap<InvoiceDetail>(window.desktopApi.createInvoiceFromOrder(orderId)),
  openCashSession: (openingAmount: number) => unwrap(window.desktopApi.openCashSession(openingAmount)),
  cashSummary: () => unwrap<CashSessionSummary>(window.desktopApi.getCashSummary()),
  listDeliveries: () => unwrap<DeliveryRecord[]>(window.desktopApi.listDeliveries()),
  createDelivery: (input: DeliveryInput) => unwrap<DeliveryRecord>(window.desktopApi.createDelivery(input)),
  dashboardSummary: () => unwrap<DashboardSummary>(window.desktopApi.getDashboardSummary())
};

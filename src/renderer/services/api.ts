import type { ApiResponse, CatalogsPayload, Client, ClientInput, CompanySettings, DashboardSummary, DbConnectionConfig, HealthStatus, LoginInput, Order, OrderDetail, OrderInput, SessionUser } from '@shared/types';

async function unwrap<T>(promise: Promise<unknown>): Promise<T> {
  const response = await promise as ApiResponse<T>;
  if (!response.success) throw new Error(response.error ?? 'Error desconocido.');
  return response.data as T;
}

export const api = {
  health: () => unwrap<HealthStatus>(window.desktopApi.health()),
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
  dashboardSummary: () => unwrap<DashboardSummary>(window.desktopApi.getDashboardSummary())
};

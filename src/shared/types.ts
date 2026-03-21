export type DbConnectionConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl?: boolean;
};

export type HealthStatus = {
  configured: boolean;
  connected: boolean;
  migrated: boolean;
  message: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type SessionUser = {
  id: number;
  username: string;
  roleId: number;
  roleName: string;
  displayName: string;
};

export type LoginInput = {
  username: string;
  password: string;
};

export type CompanySettings = {
  id: number;
  companyName: string;
  legalName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  currencyCode: string;
};

export type Client = {
  id: number;
  code: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
};

export type ClientInput = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  address: string | null;
  notes: string | null;
};

export type OrderStatus = {
  id: number;
  code: string;
  name: string;
  color: string;
};

export type PaymentMethod = {
  id: number;
  code: string;
  name: string;
};

export type OrderItem = {
  id: number;
  garmentTypeId: number | null;
  serviceId: number | null;
  description: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type OrderItemInput = Omit<OrderItem, 'id'>;

export type Order = {
  id: number;
  orderNumber: string;
  clientId: number;
  clientName: string;
  statusId: number;
  statusName: string;
  statusColor: string;
  notes: string | null;
  subtotal: number;
  discountTotal: number;
  total: number;
  paidTotal: number;
  balanceDue: number;
  dueDate: string | null;
  createdAt: string;
};

export type OrderInput = {
  clientId: number;
  notes: string | null;
  dueDate: string | null;
  discountTotal: number;
  paidAmount: number;
  items: OrderItemInput[];
};

export type OrderDetail = Order & {
  items: OrderItem[];
};

export type DashboardSummary = {
  clients: number;
  openOrders: number;
  dailySales: number;
  pendingBalance: number;
};

export type CatalogsPayload = {
  statuses: OrderStatus[];
  paymentMethods: PaymentMethod[];
};

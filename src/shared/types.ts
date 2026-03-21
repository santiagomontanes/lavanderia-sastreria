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
  rememberMe?: boolean;
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
  color: string | null;
  brand: string | null;
  sizeReference: string | null;
  material: string | null;
  receivedCondition: string | null;
  workDetail: string | null;
  stains: string | null;
  damages: string | null;
  missingAccessories: string | null;
  customerObservations: string | null;
  internalObservations: string | null;
  unitPrice: number;
  discountAmount: number;
  surchargeAmount: number;
  subtotal: number;
  total: number;
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
  payments: Payment[];
  invoices: Invoice[];
  deliveries: DeliveryRecord[];
};

export type Payment = {
  id: number;
  orderId: number;
  invoiceId: number | null;
  paymentMethodId: number;
  paymentMethodName: string;
  amount: number;
  reference: string | null;
  createdAt: string;
};

export type PaymentInput = {
  orderId: number;
  paymentMethodId: number;
  amount: number;
  reference: string | null;
};

export type Invoice = {
  id: number;
  invoiceNumber: string;
  orderId: number;
  clientId: number;
  clientName: string;
  subtotal: number;
  taxTotal: number;
  total: number;
  legalText: string | null;
  createdAt: string;
};

export type InvoiceDetail = Invoice & {
  items: Array<{
    id: number;
    description: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
};

export type DeliveryRecord = {
  id: number;
  orderId: number;
  deliveredTo: string;
  receiverDocument: string | null;
  receiverPhone: string | null;
  relationshipToClient: string | null;
  receiverSignature: string | null;
  outstandingBalance: number;
  ticketCode: string;
  createdAt: string;
};

export type DeliveryInput = {
  orderId: number;
  deliveredTo: string;
  receiverDocument: string | null;
  receiverPhone: string | null;
  relationshipToClient: string | null;
  receiverSignature: string | null;
  ticketCode: string;
};

export type CashSessionSummary = {
  activeSession: {
    id: number;
    openingAmount: number;
    openedAt: string;
    status: string;
  } | null;
  totalsByMethod: Array<{ methodName: string; amount: number }>;
  recentMovements: Array<{ id: number; movementType: string; amount: number; notes: string | null; createdAt: string }>;
};

export type DashboardSummary = {
  clients: number;
  openOrders: number;
  dailySales: number;
  pendingBalance: number;
  openWarranties: number;
  dailyExpenses: number;
  recentOrders: Order[];
  paymentBreakdown: Array<{ methodName: string; amount: number }>;
};

export type CatalogsPayload = {
  statuses: OrderStatus[];
  paymentMethods: PaymentMethod[];
};

export type ExternalLinkPayload = {
  url: string;
};

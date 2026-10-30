export type TicketPriority = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export type TicketStatus = 'ABIERTO' | 'EN_PROCESO' | 'RESUELTO';

export type UserRole = 'CLIENTE' | 'SOPORTE';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  owner: string;
  createdAt: string;
  imageUrl?: string | null;
}

export interface CreateTicketDTO {
  title: string;
  description: string;
  priority: TicketPriority;
  owner: string;
  imageUrl?: string | null;
}

export interface UpdateTicketDTO {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  owner?: string;
  imageUrl?: string | null;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  role: UserRole;
  name: string;
}

export interface AuthSession {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  currentDate?: string;
  hasPrev: boolean;
  hasNext: boolean;
}

export interface PaginatedTicketsResponse {
  data: Ticket[];
  pagination: PaginationMeta;
}

export const VALID_PRIORITIES: readonly TicketPriority[] = ['BAJA', 'MEDIA', 'ALTA', 'CRITICA'];
export const VALID_STATUSES: readonly TicketStatus[] = ['ABIERTO', 'EN_PROCESO', 'RESUELTO'];

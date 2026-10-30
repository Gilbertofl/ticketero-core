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

export interface CreateTicketPayload {
  title: string;
  description: string;
  priority: TicketPriority;
  owner: string;
  imageUrl?: string | null;
}

export interface UpdateTicketPayload {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  status?: TicketStatus;
  owner?: string;
  imageUrl?: string | null;
}

export interface AuthSession {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export interface LoginResponse {
  success: boolean;
  user?: AuthSession;
  message?: string;
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

const API_BASE_URL =
  window.location.port === '3000'
    ? '/api'
    : `http://${window.location.hostname || 'localhost'}:3000/api`;

export const api = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = (await response.json()) as LoginResponse;
    return data;
  },

  async getTickets(options: {
    page?: number;
    limit?: number;
    date?: string;
    owner?: string;
    status?: string;
  } = {}): Promise<PaginatedTicketsResponse> {
    const params = new URLSearchParams();
    if (options.page) params.set('page', String(options.page));
    if (options.limit) params.set('limit', String(options.limit));
    if (options.date) params.set('date', options.date);
    if (options.owner) params.set('owner', options.owner);
    if (options.status) params.set('status', options.status);

    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`${API_BASE_URL}/tickets${query}`);
    if (!response.ok) {
      throw new Error(`Error al obtener tickets (${response.status})`);
    }
    return (await response.json()) as PaginatedTicketsResponse;
  },

  async uploadImage(file: File): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'image/jpeg',
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error('Error al subir la imagen al servidor');
    }

    const data = (await response.json()) as { imageUrl: string };
    return data.imageUrl;
  },

  async createTicket(payload: CreateTicketPayload): Promise<Ticket> {
    const response = await fetch(`${API_BASE_URL}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errBody = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(errBody.error || 'No se pudo crear el ticket');
    }

    return (await response.json()) as Ticket;
  },

  async updateTicket(id: string, payload: UpdateTicketPayload): Promise<Ticket> {
    const response = await fetch(`${API_BASE_URL}/tickets/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errBody = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(errBody.error || 'No se pudo actualizar el ticket');
    }

    return (await response.json()) as Ticket;
  },
};

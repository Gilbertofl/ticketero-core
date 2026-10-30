import crypto from 'node:crypto';
import { pool } from '../config/db';
import {
  AuthSession,
  CreateTicketDTO,
  PaginatedTicketsResponse,
  Ticket,
  TicketPriority,
  TicketStatus,
  UpdateTicketDTO,
  UserRole,
} from '../types';

interface TicketRow {
  id: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  owner: string;
  created_at: Date | string;
  image_url?: string | null;
  total_count?: string;
}

function mapRowToTicket(row: TicketRow): Ticket {
  const createdAt =
    row.created_at instanceof Date
      ? row.created_at.toISOString()
      : new Date(row.created_at).toISOString();

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    priority: row.priority,
    status: row.status,
    owner: row.owner,
    createdAt,
    imageUrl: row.image_url || null,
  };
}

export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthSession | null> {
  const result = await pool.query<{
    id: string;
    email: string;
    role: UserRole;
    name: string;
  }>(
    'SELECT id, email, role, name FROM users WHERE LOWER(email) = LOWER($1) AND password = $2 LIMIT 1',
    [email.trim(), password]
  );

  if (result.rowCount === 0) {
    return null;
  }

  return result.rows[0];
}

export interface TicketFilterOptions {
  date?: string; // YYYY-MM-DD
  owner?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export async function getPaginatedTickets(
  options: TicketFilterOptions
): Promise<PaginatedTicketsResponse> {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.max(1, Math.min(50, Number(options.limit) || 10));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const params: unknown[] = [];

  // Filtro de fecha: Si viene 'date', filtra por ese día. Si viene 'all', no filtra fecha. Por defecto: hoy.
  let targetDate = options.date;
  if (!targetDate) {
    // Fecha local del servidor YYYY-MM-DD
    targetDate = new Date().toISOString().slice(0, 10);
  }

  if (targetDate !== 'all') {
    params.push(targetDate);
    conditions.push(`DATE(created_at) = $${params.length}`);
  }

  if (options.owner && options.owner.trim() !== '') {
    params.push(options.owner.trim());
    conditions.push(`LOWER(owner) = LOWER($${params.length})`);
  }

  if (options.status && options.status.trim() !== '') {
    params.push(options.status.trim().toUpperCase());
    conditions.push(`status = $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  params.push(limit);
  const limitIndex = params.length;
  params.push(offset);
  const offsetIndex = params.length;

  const sql = `
    SELECT id, title, description, priority, status, owner, created_at, image_url,
           COUNT(*) OVER() AS total_count
    FROM tickets
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${limitIndex} OFFSET $${offsetIndex}
  `;

  const res = await pool.query<TicketRow>(sql, params);
  const total = res.rows.length > 0 ? Number(res.rows[0].total_count) : 0;
  const totalPages = Math.ceil(total / limit) || 1;

  return {
    data: res.rows.map(mapRowToTicket),
    pagination: {
      page,
      limit,
      total,
      totalPages,
      currentDate: targetDate,
      hasPrev: page > 1,
      hasNext: page < totalPages,
    },
  };
}

export async function getTicketById(id: string): Promise<Ticket | null> {
  const res = await pool.query<TicketRow>(
    `SELECT id, title, description, priority, status, owner, created_at, image_url
     FROM tickets
     WHERE id = $1`,
    [id]
  );
  if (res.rowCount === 0) {
    return null;
  }
  return mapRowToTicket(res.rows[0]);
}

export async function createTicket(dto: CreateTicketDTO): Promise<Ticket> {
  const id = crypto.randomUUID();
  const status: TicketStatus = 'ABIERTO';
  const createdAt = new Date().toISOString();
  const imageUrl = dto.imageUrl && dto.imageUrl.trim() !== '' ? dto.imageUrl.trim() : null;

  const res = await pool.query<TicketRow>(
    `INSERT INTO tickets (id, title, description, priority, status, owner, created_at, image_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, title, description, priority, status, owner, created_at, image_url`,
    [
      id,
      dto.title.trim(),
      dto.description.trim(),
      dto.priority,
      status,
      dto.owner.trim(),
      createdAt,
      imageUrl,
    ]
  );

  return mapRowToTicket(res.rows[0]);
}

export async function updateTicket(id: string, dto: UpdateTicketDTO): Promise<Ticket | null> {
  const existing = await getTicketById(id);
  if (!existing) {
    return null;
  }

  const nextTitle = dto.title !== undefined ? dto.title.trim() : existing.title;
  const nextDescription =
    dto.description !== undefined ? dto.description.trim() : existing.description;
  const nextPriority = dto.priority !== undefined ? dto.priority : existing.priority;
  const nextStatus = dto.status !== undefined ? dto.status : existing.status;
  const nextOwner = dto.owner !== undefined ? dto.owner.trim() : existing.owner;
  const nextImageUrl =
    dto.imageUrl !== undefined
      ? dto.imageUrl && dto.imageUrl.trim() !== ''
        ? dto.imageUrl.trim()
        : null
      : existing.imageUrl;

  const res = await pool.query<TicketRow>(
    `UPDATE tickets
     SET title = $1,
         description = $2,
         priority = $3,
         status = $4,
         owner = $5,
         image_url = $6
     WHERE id = $7
     RETURNING id, title, description, priority, status, owner, created_at, image_url`,
    [nextTitle, nextDescription, nextPriority, nextStatus, nextOwner, nextImageUrl, id]
  );

  if (res.rowCount === 0) {
    return null;
  }

  return mapRowToTicket(res.rows[0]);
}

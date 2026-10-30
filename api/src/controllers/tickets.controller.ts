import { IncomingMessage, ServerResponse } from 'node:http';
import {
  createTicket,
  getPaginatedTickets,
  getTicketById,
  TicketFilterOptions,
  updateTicket,
} from '../services/tickets.service';
import {
  dispatchClientStatusAlertAsync,
  dispatchSupportAlertAsync,
} from '../services/fcm.service';
import {
  TicketPriority,
  TicketStatus,
  VALID_PRIORITIES,
  VALID_STATUSES,
} from '../types';

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

export async function handleGetTickets(
  req: IncomingMessage,
  res: ServerResponse,
  filterOptions: TicketFilterOptions
): Promise<void> {
  const paginatedResult = await getPaginatedTickets(filterOptions);
  sendJson(res, 200, paginatedResult);
}

export async function handleCreateTicket(
  req: IncomingMessage,
  res: ServerResponse,
  body: Record<string, unknown>
): Promise<void> {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const priorityRaw =
    typeof body.priority === 'string' ? (body.priority.toUpperCase() as TicketPriority) : 'BAJA';
  const owner = typeof body.owner === 'string' ? body.owner.trim() : '';
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl.trim() : null;

  if (!title || !description || !owner) {
    sendJson(res, 400, {
      error: 'Los campos title, description y owner son obligatorios.',
    });
    return;
  }

  if (!VALID_PRIORITIES.includes(priorityRaw)) {
    sendJson(res, 400, {
      error: `Prioridad inválida. Valores permitidos: ${VALID_PRIORITIES.join(', ')}`,
    });
    return;
  }

  const created = await createTicket({
    title,
    description,
    priority: priorityRaw,
    owner,
    imageUrl,
  });

  // Notificar a Soporte (siempre si es ALTA/CRITICA, o nuevo ticket para monitoreo)
  dispatchSupportAlertAsync(created);

  sendJson(res, 201, created);
}

export async function handleUpdateTicket(
  req: IncomingMessage,
  res: ServerResponse,
  ticketId: string,
  body: Record<string, unknown>
): Promise<void> {
  const previous = await getTicketById(ticketId);
  if (!previous) {
    sendJson(res, 404, { error: 'Ticket no encontrado.' });
    return;
  }

  const title = typeof body.title === 'string' ? body.title.trim() : undefined;
  const description =
    typeof body.description === 'string' ? body.description.trim() : undefined;
  const priority =
    typeof body.priority === 'string'
      ? (body.priority.toUpperCase() as TicketPriority)
      : undefined;
  const status =
    typeof body.status === 'string'
      ? (body.status.toUpperCase() as TicketStatus)
      : undefined;
  const owner = typeof body.owner === 'string' ? body.owner.trim() : undefined;
  const imageUrl =
    typeof body.imageUrl === 'string'
      ? body.imageUrl.trim()
      : body.imageUrl === null
      ? null
      : undefined;

  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    sendJson(res, 400, {
      error: `Prioridad inválida. Valores permitidos: ${VALID_PRIORITIES.join(', ')}`,
    });
    return;
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    sendJson(res, 400, {
      error: `Estado inválido. Valores permitidos: ${VALID_STATUSES.join(', ')}`,
    });
    return;
  }

  const updated = await updateTicket(ticketId, {
    title,
    description,
    priority,
    status,
    owner,
    imageUrl,
  });

  if (!updated) {
    sendJson(res, 404, { error: 'Ticket no encontrado.' });
    return;
  }

  // Si cambió de estado (ej: a EN_PROCESO o RESUELTO), notificar al Cliente
  if (status && status !== previous.status) {
    dispatchClientStatusAlertAsync(updated);
  }

  // Si se escaló a ALTA o CRITICA, alertar a Soporte
  if (priority && priority !== previous.priority && (priority === 'ALTA' || priority === 'CRITICA')) {
    dispatchSupportAlertAsync(updated);
  }

  sendJson(res, 200, updated);
}

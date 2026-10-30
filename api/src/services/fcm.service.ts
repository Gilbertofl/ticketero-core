import * as admin from 'firebase-admin';
import path from 'node:path';
import fs from 'node:fs';
import { ServerResponse } from 'node:http';
import { Ticket } from '../types';

const SUPPORT_TOPIC = 'tickets_soporte';
let firebaseInitialized = false;

// Almacén en memoria de clientes conectados vía Server-Sent Events (SSE) en Web
interface SseClient {
  id: string;
  res: ServerResponse;
  role: 'CLIENTE' | 'SOPORTE';
  email: string;
}

const sseClients: SseClient[] = [];

export function addSseClient(
  id: string,
  res: ServerResponse,
  role: 'CLIENTE' | 'SOPORTE',
  email: string
): void {
  sseClients.push({ id, res, role, email: email.toLowerCase() });
}

export function removeSseClient(id: string): void {
  const index = sseClients.findIndex((c) => c.id === id);
  if (index !== -1) {
    sseClients.splice(index, 1);
  }
}

export function broadcastSse(targetRole: 'ALL' | 'CLIENTE' | 'SOPORTE', targetEmail: string | null, eventData: unknown): void {
  const payload = `data: ${JSON.stringify(eventData)}\n\n`;

  for (const client of sseClients) {
    if (targetRole !== 'ALL' && client.role !== targetRole) {
      continue;
    }
    if (targetEmail && client.email !== targetEmail.toLowerCase()) {
      continue;
    }

    try {
      client.res.write(payload);
    } catch {
      // Ignorar cliente desconectado
    }
  }
}

export function sanitizeTopicName(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9-_.~%]/g, '_');
}

export function initFirebaseAdmin(): void {
  if (firebaseInitialized) return;

  const defaultKeyPath = path.resolve(__dirname, '../config/firebase-service-account.json');

  try {
    if (fs.existsSync(defaultKeyPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(defaultKeyPath, 'utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseInitialized = true;
      console.log(`[FCM] Firebase Admin inicializado exitosamente con el proyecto: ${serviceAccount.project_id}`);
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseInitialized = true;
      console.log(`[FCM] Firebase Admin inicializado mediante FIREBASE_SERVICE_ACCOUNT (${serviceAccount.project_id})`);
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      firebaseInitialized = true;
      console.log('[FCM] Firebase Admin inicializado mediante GOOGLE_APPLICATION_CREDENTIALS');
    } else {
      console.log(
        '[FCM] Sin credenciales de Firebase configuradas. Operando en modo despacho asíncrono simulado.'
      );
    }
  } catch (error) {
    console.warn('[FCM] No fue posible inicializar Firebase Admin:', error);
  }
}

/**
 * Notificación hacia Soporte (cuando entra un nuevo ticket o se escala)
 */
export function dispatchSupportAlertAsync(ticket: Ticket): void {
  // 1. Emitir hacia clientes Web (SSE) de rol SOPORTE en tiempo real
  broadcastSse('SOPORTE', null, {
    type: 'NEW_TICKET',
    ticket,
    title: `[${ticket.priority}] ${ticket.title}`,
    body: `${ticket.description.slice(0, 100)} (Por: ${ticket.owner})`,
    timestamp: new Date().toISOString(),
  });

  // 2. Emitir hacia Firebase FCM para técnicos móviles
  setImmediate(() => {
    void (async () => {
      const payload: admin.messaging.Message = {
        topic: SUPPORT_TOPIC,
        notification: {
          title: `[${ticket.priority}] ${ticket.title}`,
          body: `${ticket.description.slice(0, 100)} • Propietario: ${ticket.owner}`,
        },
        data: {
          ticketId: String(ticket.id),
          priority: String(ticket.priority),
          status: String(ticket.status),
          createdAt: String(ticket.createdAt),
          type: 'NEW_TICKET',
        },
      };

      try {
        if (firebaseInitialized) {
          const messageId = await admin.messaging().send(payload);
          console.log(
            `[FCM Soporte] Notificación enviada al topic "${SUPPORT_TOPIC}" para ticket ${ticket.id} (msgId: ${messageId})`
          );
        } else {
          console.log(
            `[FCM Simulado Soporte -> topic "${SUPPORT_TOPIC}"] Ticket ${ticket.id} (${ticket.priority}): "${ticket.title}"`
          );
        }
      } catch (err) {
        console.error(`[FCM] Error al despachar alerta a soporte del ticket ${ticket.id}:`, err);
      }
    })();
  });
}

/**
 * Notificación hacia el Cliente cuando su ticket es tomado o resuelto
 */
export function dispatchClientStatusAlertAsync(ticket: Ticket): void {
  const cleanEmail = sanitizeTopicName(ticket.owner);
  const clientTopic = `cliente_${cleanEmail}`;

  const actionTitle =
    ticket.status === 'EN_PROCESO'
      ? 'Tu ticket ha sido tomado por Soporte'
      : ticket.status === 'RESUELTO'
      ? 'Tu ticket ha sido RESUELTO'
      : `Actualización de ticket: ${ticket.status}`;

  // 1. Emitir hacia clientes Web (SSE) del propietario del ticket
  broadcastSse('CLIENTE', ticket.owner, {
    type: 'STATUS_UPDATE',
    ticket,
    title: actionTitle,
    body: `Ticket: "${ticket.title}". Estado actual: ${ticket.status}`,
    timestamp: new Date().toISOString(),
  });

  // 2. Emitir hacia Firebase FCM para la app móvil del cliente
  setImmediate(() => {
    void (async () => {
      const payload: admin.messaging.Message = {
        topic: clientTopic,
        notification: {
          title: actionTitle,
          body: `Ticket: "${ticket.title}". Estado actual: ${ticket.status}`,
        },
        data: {
          ticketId: String(ticket.id),
          status: String(ticket.status),
          priority: String(ticket.priority),
          type: 'STATUS_UPDATE',
        },
      };

      try {
        if (firebaseInitialized) {
          const messageId = await admin.messaging().send(payload);
          console.log(
            `[FCM Cliente] Notificación enviada al topic "${clientTopic}" para ticket ${ticket.id} (msgId: ${messageId})`
          );
        } else {
          console.log(
            `[FCM Simulado Cliente -> topic "${clientTopic}"] Ticket ${ticket.id}: "${actionTitle}"`
          );
        }
      } catch (err) {
        console.error(`[FCM] Error al notificar al cliente del ticket ${ticket.id}:`, err);
      }
    })();
  });
}

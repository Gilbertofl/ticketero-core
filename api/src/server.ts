import http, { IncomingMessage, ServerResponse } from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { initDatabase } from './config/db';
import {
  addSseClient,
  initFirebaseAdmin,
  removeSseClient,
} from './services/fcm.service';
import { handleLogin } from './controllers/auth.controller';
import {
  handleCreateTicket,
  handleGetTickets,
  handleUpdateTicket,
} from './controllers/tickets.controller';

const PORT = Number(process.env.PORT || 3000);
const WEB_ROOT = path.resolve(__dirname, '../../web');
const UPLOADS_ROOT = path.resolve(__dirname, '../uploads');

// Asegurar existencia del directorio físico de uploads
if (!fs.existsSync(UPLOADS_ROOT)) {
  fs.mkdirSync(UPLOADS_ROOT, { recursive: true });
}

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function setCorsHeaders(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function parseJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk: Buffer) => {
      raw += chunk.toString('utf-8');
      if (raw.length > 2_000_000) {
        reject(new Error('Payload demasiado grande'));
      }
    });
    req.on('end', () => {
      if (!raw.trim()) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        resolve(parsed);
      } catch {
        reject(new Error('JSON inválido'));
      }
    });
    req.on('error', reject);
  });
}

function handleRawUpload(req: IncomingMessage, res: ServerResponse): void {
  const contentType = req.headers['content-type'] || '';
  let ext = '.jpg';
  if (contentType.includes('png')) ext = '.png';
  else if (contentType.includes('webp')) ext = '.webp';

  const filename = `${crypto.randomUUID()}${ext}`;
  const savePath = path.join(UPLOADS_ROOT, filename);
  const writeStream = fs.createWriteStream(savePath);

  req.pipe(writeStream);

  writeStream.on('finish', () => {
    res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ imageUrl: `/uploads/${filename}` }));
  });

  writeStream.on('error', (err) => {
    console.error('[Upload Error]:', err);
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Error al guardar la imagen' }));
  });
}

function serveUploadedFile(filename: string, res: ServerResponse): void {
  const safeName = path.basename(filename);
  const filePath = path.join(UPLOADS_ROOT, safeName);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Imagen no encontrada');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'public, max-age=86400' });
  fs.createReadStream(filePath).pipe(res);
}

function handleSseStream(req: IncomingMessage, res: ServerResponse, url: URL): void {
  const role = (url.searchParams.get('role') || 'CLIENTE').toUpperCase() as 'CLIENTE' | 'SOPORTE';
  const email = url.searchParams.get('email') || '';
  const clientId = crypto.randomUUID();

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Conectado al stream SSE de Ticketero' })}\n\n`);

  addSseClient(clientId, res, role, email);

  req.on('close', () => {
    removeSseClient(clientId);
  });
}

function serveStaticFile(reqPath: string, res: ServerResponse): void {
  const safeSuffix = path.normalize(decodeURIComponent(reqPath)).replace(/^(\.\.(\/|\\|$))+/, '');
  let filePath = path.join(WEB_ROOT, safeSuffix === '/' ? 'index.html' : safeSuffix);

  if (!filePath.startsWith(WEB_ROOT)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Acceso denegado');
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    const notFoundView = path.join(WEB_ROOT, 'views', '404.html');
    if (fs.existsSync(notFoundView)) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(fs.readFileSync(notFoundView));
      return;
    }
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Recurso no encontrado');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
}

async function requestListener(req: IncomingMessage, res: ServerResponse): Promise<void> {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const host = req.headers.host || `localhost:${PORT}`;
  const url = new URL(req.url || '/', `http://${host}`);
  const pathname = url.pathname;

  try {
    if (pathname === '/api/health' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
      return;
    }

    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      await handleLogin(req, res, body);
      return;
    }

    // Endpoint Server-Sent Events (SSE) en tiempo real
    if (pathname === '/api/notifications/stream' && req.method === 'GET') {
      handleSseStream(req, res, url);
      return;
    }

    // Endpoint para recepción de imágenes
    if (pathname === '/api/upload' && req.method === 'POST') {
      handleRawUpload(req, res);
      return;
    }

    // Servir imágenes físicas desde api/uploads/
    if (pathname.startsWith('/uploads/')) {
      const filename = pathname.replace('/uploads/', '');
      serveUploadedFile(filename, res);
      return;
    }

    // Tickets paginados con filtro de fecha
    if (pathname === '/api/tickets' && req.method === 'GET') {
      const date = url.searchParams.get('date') || undefined;
      const owner = url.searchParams.get('owner') || undefined;
      const status = url.searchParams.get('status') || undefined;
      const page = Number(url.searchParams.get('page')) || 1;
      const limit = Number(url.searchParams.get('limit')) || 10;

      await handleGetTickets(req, res, { date, owner, status, page, limit });
      return;
    }

    if (pathname === '/api/tickets' && req.method === 'POST') {
      const body = await parseJsonBody(req);
      await handleCreateTicket(req, res, body);
      return;
    }

    const ticketMatch = pathname.match(/^\/api\/tickets\/([a-zA-Z0-9-]+)$/);
    if (ticketMatch && (req.method === 'PUT' || req.method === 'PATCH')) {
      const ticketId = ticketMatch[1];
      const body = await parseJsonBody(req);
      await handleUpdateTicket(req, res, ticketId, body);
      return;
    }

    if (pathname.startsWith('/api/')) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: 'Endpoint no encontrado' }));
      return;
    }

    // Servidor estático integrado para el portal web
    serveStaticFile(pathname, res);
  } catch (error) {
    console.error('[Server Error]:', error);
    const message = error instanceof Error ? error.message : 'Error interno del servidor';
    const status = message === 'JSON inválido' ? 400 : 500;
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: message }));
  }
}

async function bootstrap(): Promise<void> {
  await initDatabase();
  initFirebaseAdmin();

  const server = http.createServer((req, res) => {
    void requestListener(req, res);
  });

  server.listen(PORT, () => {
    console.log(`[Ticketero API & Web] Servidor activo en http://localhost:${PORT}`);
  });
}

void bootstrap();

import { IncomingMessage, ServerResponse } from 'node:http';
import { authenticateUser } from '../services/tickets.service';

export async function handleLogin(
  req: IncomingMessage,
  res: ServerResponse,
  body: Record<string, unknown>
): Promise<void> {
  const email = typeof body.email === 'string' ? body.email : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(
      JSON.stringify({
        success: false,
        message: 'Debes proporcionar correo electrónico y contraseña.',
      })
    );
    return;
  }

  const session = await authenticateUser(email, password);
  if (!session) {
    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(
      JSON.stringify({
        success: false,
        message: 'Credenciales incorrectas.',
      })
    );
    return;
  }

  res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(
    JSON.stringify({
      success: true,
      user: session,
    })
  );
}

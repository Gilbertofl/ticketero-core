import { Pool } from 'pg';
import crypto from 'node:crypto';
import { Ticket, User } from '../types';

const connectionString =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:5432/ticketero';

export const pool = new Pool({
  connectionString,
});

export async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        email VARCHAR(150) UNIQUE NOT NULL,
        password VARCHAR(150) NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('CLIENTE', 'SOPORTE')),
        name VARCHAR(150) NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id VARCHAR(64) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        priority VARCHAR(20) NOT NULL CHECK (priority IN ('BAJA', 'MEDIA', 'ALTA', 'CRITICA')),
        status VARCHAR(20) NOT NULL CHECK (status IN ('ABIERTO', 'EN_PROCESO', 'RESUELTO')),
        owner VARCHAR(150) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const userCountRes = await client.query<{ count: string }>('SELECT COUNT(*) AS count FROM users');
    if (Number(userCountRes.rows[0].count) === 0) {
      const seedUsers: User[] = [
        {
          id: '1',
          email: 'example1@live.com',
          password: '12345',
          role: 'CLIENTE',
          name: 'Cliente Demo 1',
        },
        {
          id: '2',
          email: 'example2@live.com',
          password: '5263',
          role: 'SOPORTE',
          name: 'Agente Soporte 1',
        },
        {
          id: '3',
          email: 'example4@live.com',
          password: '1234',
          role: 'CLIENTE',
          name: 'Cliente Demo 2',
        },
        {
          id: '4',
          email: 'example5@live.com',
          password: '1234',
          role: 'SOPORTE',
          name: 'Agente Soporte 2',
        },
      ];

      for (const u of seedUsers) {
        await client.query(
          'INSERT INTO users (id, email, password, role, name) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO NOTHING',
          [u.id, u.email, u.password, u.role, u.name]
        );
      }
    }

    const ticketCountRes = await client.query<{ count: string }>(
      'SELECT COUNT(*) AS count FROM tickets'
    );
    if (Number(ticketCountRes.rows[0].count) === 0) {
      const now = Date.now();
      const seedTickets: Ticket[] = [
        {
          id: crypto.randomUUID(),
          title: 'Falla de acceso en VPN corporativa',
          description: 'No permite autenticar con las credenciales del dominio desde sucursal norte.',
          priority: 'CRITICA',
          status: 'ABIERTO',
          owner: 'example1@live.com',
          createdAt: new Date(now - 3600_000 * 4).toISOString(),
        },
        {
          id: crypto.randomUUID(),
          title: 'Lentitud en generación de reportes mensuales',
          description: 'El módulo de facturación tarda más de 40 segundos en exportar el PDF.',
          priority: 'ALTA',
          status: 'EN_PROCESO',
          owner: 'example1@live.com',
          createdAt: new Date(now - 3600_000 * 2).toISOString(),
        },
        {
          id: crypto.randomUUID(),
          title: 'Actualización de permisos de correo',
          description: 'Solicito agregar acceso al buzón compartido de ventas.',
          priority: 'BAJA',
          status: 'ABIERTO',
          owner: 'example4@live.com',
          createdAt: new Date(now - 3600_000).toISOString(),
        },
      ];

      for (const t of seedTickets) {
        await client.query(
          `INSERT INTO tickets (id, title, description, priority, status, owner, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [t.id, t.title, t.description, t.priority, t.status, t.owner, t.createdAt]
        );
      }
    }
  } finally {
    client.release();
  }
}

-- ========================================================
-- Ticketero - Base de Datos PostgreSQL
-- Esquemas DDL, Índices y Datos Semilla Iniciales
-- ========================================================

-- 1. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(150) UNIQUE NOT NULL,
    password VARCHAR(150) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('CLIENTE', 'SOPORTE')),
    name VARCHAR(150) NOT NULL
);

-- 2. Tabla de Incidencias / Tickets
CREATE TABLE IF NOT EXISTS tickets (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL CHECK (priority IN ('BAJA', 'MEDIA', 'ALTA', 'CRITICA')),
    status VARCHAR(20) NOT NULL CHECK (status IN ('ABIERTO', 'EN_PROCESO', 'RESUELTO')),
    owner VARCHAR(150) NOT NULL,
    image_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Índices para Alto Rendimiento
CREATE INDEX IF NOT EXISTS idx_tickets_owner ON tickets(owner);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(created_at DESC);

-- 4. Datos de Prueba Iniciales (Usuarios Semilla)
INSERT INTO users (id, email, password, role, name) VALUES
('1', 'example1@live.com', '12345', 'CLIENTE', 'Cliente Demo 1'),
('2', 'example2@live.com', '5263', 'SOPORTE', 'Agente Soporte 1'),
('3', 'example4@live.com', '1234', 'CLIENTE', 'Cliente Demo 2'),
('4', 'example5@live.com', '1234', 'SOPORTE', 'Agente Soporte 2')
ON CONFLICT (email) DO NOTHING;

-- 5. Datos de Prueba Iniciales (Tickets Semilla)
INSERT INTO tickets (id, title, description, priority, status, owner, created_at) VALUES
(
    'a1b2c3d4-0001-4000-8000-000000000001',
    'Falla de acceso en VPN corporativa',
    'No permite autenticar con las credenciales del dominio desde la sucursal norte.',
    'CRITICA',
    'EN_PROCESO',
    'example1@live.com',
    NOW() - INTERVAL '4 hours'
),
(
    'a1b2c3d4-0002-4000-8000-000000000002',
    'Lentitud en generación de reportes mensuales',
    'El módulo de facturación tarda más de 40 segundos en exportar el formato PDF.',
    'ALTA',
    'RESUELTO',
    'example1@live.com',
    NOW() - INTERVAL '2 hours'
),
(
    'a1b2c3d4-0003-4000-8000-000000000003',
    'Actualización de permisos de correo',
    'Solicito agregar acceso al buzón compartido del departamento de ventas.',
    'BAJA',
    'RESUELTO',
    'example4@live.com',
    NOW() - INTERVAL '1 hour'
),
(
    'a1b2c3d4-0004-4000-8000-000000000004',
    'Impresora de red en recepción bloqueada',
    'La cola de impresión se congela y rechaza trabajos con error de spooler.',
    'MEDIA',
    'ABIERTO',
    'example1@live.com',
    NOW() - INTERVAL '25 minutes'
)
ON CONFLICT (id) DO NOTHING;

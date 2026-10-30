# 🎫 Ticketero — Sistema Integral de Gestión de Incidencias en Tiempo Real

**Ticketero** es una plataforma integral multiplataforma diseñada para optimizar el reporte, seguimiento y resolución de incidencias técnicas en tiempo real. 

El proyecto está organizado como un **Monorepositorio** que conecta un **Backend centralizado**, un **Portal Web interactivo** y una **Aplicación Móvil nativa** (Android), manteniendo una experiencia sincronizada al instante entre clientes y personal de soporte.

---

## 🎯 ¿Qué problema resuelve?

En muchas organizaciones, el soporte técnico sufre retrasos por falta de comunicación ágil entre el usuario que reporta una falla y el técnico encargado de resolverla.

**Ticketero resuelve esto mediante:**
1. **Reporte ágil con evidencia multimedia:** Los usuarios reportan incidencias adjuntando fotos tomadas con la cámara del celular o cargadas desde la web.
2. **Notificaciones Push y Alertas en Vivo:** Cuando un cliente crea un ticket, el equipo de soporte recibe una notificación inmediata en sus dispositivos (Firebase Cloud Messaging y Server-Sent Events).
3. **Sincronización reactiva en tiempo real:** Cuando un técnico toma o resuelve una incidencia, la app móvil del cliente y el portal web se actualizan al instante sin necesidad de recargar la pantalla.
4. **Control por roles y fechas:** Visualización ordenada con filtros por día y paginación rápida para evitar sobrecarga de información.

---

## 🏛️ Estructura del Monorepositorio

```text
Ticketero/
├── 📁 api/                      # Backend & API REST (Node.js + TypeScript + PostgreSQL + FCM)
│   ├── 📁 db/
│   │   └── 📄 init.sql          # Script SQL con esquema DDL, índices y datos semilla
│   ├── 📁 src/                  # Lógica de controladores, servicios y endpoints nativos
│   ├── 📁 uploads/              # Almacén de fotos y evidencia técnica
│   ├── 📄 Dockerfile            # Contenedor de producción para API y Web
│   └── 📄 package.json
├── 📁 web/                      # Portal Web para Clientes y Soporte (HTML5/CSS3/TS)
│   ├── 📁 css/                  # Estilos visuales modernos y responsivos
│   ├── 📁 src/                  # Código TypeScript vanilla (sin frameworks pesados)
│   └── 📄 index.html            # Punto de entrada / Login
├── 📁 mobile/                   # Aplicación Móvil en Flutter (Android)
│   ├── 📁 lib/                  # Vistas, modelos, servicios FCM y AppConfig
│   └── 📄 pubspec.yaml
├── 📄 docker-compose.yml        # Orquestación de PostgreSQL + API en 1 comando
└── 📄 README.md                 # Documentación del proyecto
```

---

## 👥 Roles del Sistema y Credenciales Demo

El sistema inicializa automáticamente las siguientes cuentas de prueba:

| Rol | Correo | Contraseña | Capacidades |
| :--- | :--- | :--- | :--- |
| **Cliente Demo** | `example1@live.com` | `12345` | • Crear tickets con foto y prioridad.<br>• Ver únicamente sus propias incidencias.<br>• Recibir alertas cuando su ticket sea tomado o resuelto. |
| **Soporte Técnico** | `example2@live.com` | `5263` | • Ver todos los tickets del día o por fecha.<br>• Tomar tickets abiertos y cambiarlos a `EN PROCESO` o `RESUELTO`.<br>• Recibir alertas instantáneas cuando entra un ticket nuevo. |

---

## 💾 Base de Datos y Datos de Prueba (`init.sql`)

El proyecto incluye el archivo SQL listo para producción y pruebas en [`api/db/init.sql`]:
* **Tablas DDL:** Creación de tablas `users` y `tickets` con llaves foráneas y validaciones `CHECK`.
* **Optimización e Índices:** Índices en `owner`, `status` y `created_at DESC` para consultas de alta concurrencia.
* **Datos Semilla:** Inserta de forma idempotente (`ON CONFLICT DO NOTHING`) los usuarios demo y tickets de prueba con diferentes niveles de urgencia (`CRITICA`, `ALTA`, `MEDIA`, `BAJA`).

---

## 🔔 Configuración de Firebase (Notificaciones Push)

> [!IMPORTANT]
> **Privacidad y Seguridad de Credenciales:**  
> Por estándares de seguridad, los archivos de credenciales privadas de Firebase **NO se incluyen en el repositorio** (están protegidos por `.gitignore`):
> * `google-services.json` (requerido para la app Android).
> * `firebase-service-account.json` (llave privada del Backend).

### Si deseas habilitar Firebase en tu entorno:
1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. **Para la App Móvil:**
   * Registra una app Android con el identificador de paquete: `com.ticketero.app`.
   * Descarga el archivo `google-services.json` y colócalo dentro de:
     `mobile/android/app/google-services.json`.
3. **Para el Backend:**
   * En la configuración del proyecto Firebase -> *Cuentas de servicio*, genera una nueva clave privada en formato JSON.
   * Guarda este archivo como `api/config/firebase-service-account.json` (o expórtalo como variable de entorno `FIREBASE_SERVICE_ACCOUNT`).

*(Nota: Si no se configuran credenciales de Firebase, el Backend funcionará normalmente activando el modo de despacho simulado por consola y el Portal Web continuará recibiendo alertas en tiempo real mediante Server-Sent Events).*

---

## 🛠️ Cómo Ejecutar el Proyecto

Tienes **dos opciones** sencillas para poner en marcha el sistema:

---

### Opción 1: Levantar con Docker (1 Solo Comando — Recomendado)

Levanta la base de datos PostgreSQL poblada con datos y el servidor web/API sin necesidad de instalar dependencias locales:

```bash
docker compose up -d
```

* **Base de datos:** Se inicializa y ejecuta automáticamente en el puerto `5432` ejecutando `api/db/init.sql`.
* **Servidor & Portal Web:** Disponible inmediatamente en `http://localhost:3000`.
* Para ver los registros de la API:
  ```bash
  docker compose logs -f api
  ```
* Para detener los contenedores:
  ```bash
  docker compose down
  ```

---

### Opción 2: Levantar Localmente (Sin Docker)

#### 1. Iniciar Base de Datos PostgreSQL
1. Inicia el servicio local:
   ```bash
   sudo systemctl start postgresql
   ```
2. Crea la base de datos (si aún no existe) y ejecuta el script de datos de prueba:
   ```bash
   sudo -u postgres createdb ticketero
   sudo -u postgres psql -d ticketero -f api/db/init.sql
   ```

#### 2. Compilar e Iniciar Backend y Web
1. Ingresa a la carpeta del backend:
   ```bash
   cd api
   npm install
   ```
2. Compila el cliente web y el backend TypeScript:
   ```bash
   npm run build:web
   npm run build
   ```
3. Inicia el servidor:
   ```bash
   npm run dev
   ```
   * Accede al portal web en `http://localhost:3000`.

---

### 3. Ejecutar la Aplicación Móvil (Flutter)

1. En una nueva terminal, ingresa a la carpeta móvil:
   ```bash
   cd mobile
   ```
2. Descarga los paquetes de Flutter:
   ```bash
   flutter pub get
   ```

#### Ejecutar en Emulador Android:
El emulador de Android se conecta automáticamente al servidor de tu computadora mediante la IP interna `10.0.2.2:3000` (ya configurada por defecto):
```bash
flutter run
```

#### Ejecutar en Dispositivo Físico Android:
Si conectas un teléfono físico por USB o Wi-Fi, indícale la IP local de tu computadora:
```bash
flutter run --dart-define=API_BASE_URL="http://<TU_IP_LOCAL>:3000/api" --dart-define=SERVER_HOST="http://<TU_IP_LOCAL>:3000"
```

---

## 🎬 Demostración en Vivo del Flujo Completo

Para evaluar la sincronización en tiempo real:

1. **Abrir la Web (Soporte Técnico):**
   * Ve a `http://localhost:3000` en tu navegador.
   * Haz clic en **Soporte Demo** (`example2@live.com`) e inicia sesión.
2. **Abrir el Móvil (Cliente):**
   * En la app móvil, presiona **Cliente Demo** (`example1@live.com`) e ingresa.
3. **Crear una Incidencia desde el Móvil:**
   * Presiona el botón flotante **`+ Nueva incidencia`**.
   * Escribe título, descripción, selecciona prioridad y toma una foto de prueba.
   * Presiona **`Publicar Ticket`**.
4. **Comprobar la Reactividad en la Web:**
   * En la web, sin recargar la página, verás el aviso emergente *Toast* con sonido y el nuevo ticket aparecerá al instante en la lista.
5. **Gestionar el Ticket desde la Web:**
   * El agente de soporte presiona **Tomar Incidencia** (`EN PROCESO`) o **Marcar como Resuelto**.
6. **Comprobar la Reactividad en el Móvil:**
   * El celular desplegará la **notificación nativa del sistema (Heads-up banner)**.
   * La tarjeta cambiará de estado automáticamente en pantalla sin requerir *pull-to-refresh*.

---

## 💡 Habilidades y Buenas Prácticas Demostradas

* **Arquitectura Monorepo Limpia:** Desacoplamiento total entre frontend web, backend y app móvil.
* **Filosofía *Vanilla First*:** Dominio de estándares web nativos (DOM API, Fetch, CSS variables, ES Modules, `node:http`) sin dependencia excesiva de frameworks.
* **Contenedores y DevOps:** Configuración de `Dockerfile` multi-stage y `docker-compose.yml` con auto-aprovisionamiento SQL y *healthchecks*.
* **Comunicación en Tiempo Real:** Integración híbrida de Server-Sent Events (SSE) y Firebase Cloud Messaging (FCM).
* **Calidad de UI/UX:** Manejo ergonómico de insets (*Safe Areas* para barras de navegación de 3 botones de Android), diseño moderno y visor interactivo de imágenes.

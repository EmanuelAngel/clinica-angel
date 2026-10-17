# Guía de Despliegue & Video Showcase para Portfolio

Este documento detalla el paso a paso para levantar **Clínica Ángel** en producción con costo $0 permanente y grabar el video showcase para tu portfolio.

---

## 1. Crear la Base de Datos Gratuita en TiDB Cloud

1. Entra a [tidbcloud.com](https://tidbcloud.com/) e inicia sesión con GitHub o Google.
2. Haz clic en **Create Cluster** y selecciona **Serverless** (Plan Gratuito: 5 GB de almacenamiento, compatible con MySQL 8).
3. Una vez creado el cluster, haz clic en **Connect**:
   - Tipo de conexión: **Prisma** o **General MySQL**.
   - Haz clic en **Generate Password** y copia la contraseña segura.
4. Entra a la consola SQL integrada (**Chat2Query** o **SQL Editor** en el panel de TiDB) y ejecuta:
   ```sql
   CREATE DATABASE clinica_angel;
   ```
5. Guarda los siguientes datos de conexión que te da TiDB:
   - **Host**: `gateway01.<region>.prod.aws.tidbcloud.com`
   - **Port**: `4000`
   - **User**: `<prefijo>.root`
   - **Password**: `<tu_password>`
   - **Database**: `clinica_angel`

---

## 2. Inicializar Tablas y Datos Demo (Una sola vez desde tu PC)

No necesitas prender XAMPP ni MySQL local. Abre tu PowerShell en la carpeta del proyecto y ejecuta temporalmente las credenciales de TiDB para inicializar el esquema y los datos:

```powershell
# 1. Configura temporalmente las variables de entorno para apuntar a TiDB
$env:MYSQL_DATABASE_HOST="<tu-host-tidb>"
$env:MYSQL_DATABASE_PORT="4000"
$env:MYSQL_DATABASE_USER="<tu-usuario-tidb>"
$env:MYSQL_DATABASE_PASSWORD="<tu-password-tidb>"
$env:MYSQL_DATABASE_NAME="clinica_angel"
$env:MYSQL_DATABASE_SSL="true"
$env:MYSQL_CONNECTION_STRING="mysql://${env:MYSQL_DATABASE_USER}:${env:MYSQL_DATABASE_PASSWORD}@${env:MYSQL_DATABASE_HOST}:4000/clinica_angel?sslaccept=strict"

# 2. Crea las tablas en la nube con Prisma
pnpm prisma db push

# 3. Siembra los usuarios, médicos, pacientes y agendas demo
pnpm run db:seed
```

> **Nota:** Todos los usuarios de prueba fueron configurados con la contraseña estándar: `Demo1234!`.

---

## 3. Despliegue en Render (Web Service Nativo, Sin Docker)

1. Ve a [dashboard.render.com](https://dashboard.render.com/) e inicia sesión.
2. Haz clic en **New +** y selecciona **Web Service**.
3. Conecta tu repositorio de GitHub `clinica-angel`.
4. Completa la configuración básica:
   - **Name**: `clinica-angel`
   - **Runtime**: `Node`
   - **Region**: Elige la más cercana (o `Ohio (US East)` si TiDB está en US East para mínima latencia).
   - **Build Command**: `pnpm build`
   - **Start Command**: `node src/server.js`
   - **Instance Type**: `Free`
5. En la sección **Environment Variables**, añade las siguientes variables:

| Variable | Valor |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | `8080` |
| `JWT_SECRET` | `clinica_angel_super_jwt_secret_key_production_2026_xyz` (al menos 32 caracteres) |
| `JWT_EXPIRES` | `7d` |
| `SALT_ROUNDS` | `4` |
| `MYSQL_DATABASE_HOST` | `<tu-host-tidb>` |
| `MYSQL_DATABASE_PORT` | `4000` |
| `MYSQL_DATABASE_USER` | `<tu-usuario-tidb>` |
| `MYSQL_DATABASE_PASSWORD` | `<tu-password-tidb>` |
| `MYSQL_DATABASE_NAME` | `clinica_angel` |
| `MYSQL_DATABASE_SSL` | `true` |
| `MYSQL_CONNECTION_STRING` | `mysql://<user>:<password>@<host>:4000/clinica_angel?sslaccept=strict` |

6. Haz clic en **Deploy Web Service**.
7. En ~2 minutos Render habrá instalado dependencias, compilado Tailwind CSS, generado el cliente de Prisma y levantado el servidor con HTTPS automático (`https://clinica-angel.onrender.com`).

---

## 4. Probando la Demo en Vivo ("1-Click Demo Login")

Al acceder a tu web desplegada en `/auth/login`, verás el panel de **Acceso Rápido para Demostración**:
- **Admin**: Ingresa con un clic como Emanuel Angel.
- **Secretaria**: Ingresa como Rias Gremory.
- **Médico**: Ingresa como Nikolai Belinski.
- **Paciente**: Ingresa como Lupita Silva.

Cualquiera puede probar los flujos sin escribir contraseñas ni registrarse previamente.

---

## 5. Guión del Video Showcase (60 a 90 segundos)

Graba tu pantalla usando OBS, Loom o ScreenStudio en resolución 1080p o 1440p con tema oscuro o claro activo.

### Acto 1: Introducción & Arquitectura (0:00 - 0:20)
- **Pantalla**: Home de Clínica Ángel o vista de Login con la tarjeta de Demo Login.
- **Voz / Subtítulo**:
  > *"Clínica Ángel es un sistema integral de gestión de turnos médicos diseñado con Arquitectura Modular y Server-Side Rendering sobre Node.js, Express, Nunjucks y Prisma ORM. Soporta flujos de trabajo multi-rol: pacientes, médicos, secretaría y administradores."*

### Acto 2: Flujo del Paciente & Reserva de Turnos (0:20 - 0:50)
- **Pantalla**: Clic en botón "Paciente", navega al catálogo de especialidades o médicos, elige una fecha y reserva un turno disponible. Muestra la confirmación visual.
- **Voz / Subtítulo**:
  > *"Como paciente, el sistema permite filtrar profesionales por especialidad, consultar disponibilidad en tiempo real y reservar turnos respetando bloqueos horarios y reglas de sobreturno por franja horaria."*

### Acto 3: Panel de Gestión & Reglas de Negocio (0:50 - 1:15)
- **Pantalla**: Cerrar sesión, clic en "Secretaria" o "Admin", navegar a la vista de agendas, reprogramación o lista de espera.
- **Voz / Subtítulo**:
  > *"El personal administrativo y médico cuenta con herramientas para gestionar cancelaciones, admitir pacientes que llegan a recepción, gestionar listas de espera automáticas y auditar la carga horaria diaria."*

### Cierre (1:15 - 1:30)
- **Pantalla**: Vista del repositorio GitHub o arquitectura de carpetas (`src/_shared`, `domain`, `application`, `infrastructure`).
- **Voz / Subtítulo**:
  > *"El proyecto sigue principios de Clean Architecture y Vertical Slicing para desacoplar reglas de negocio de la infraestructura. El código completo y la demo en vivo están disponibles en mi portfolio."*

# 🏥 Clínica Angel - Sistema de Autogestión y Turnos

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![MariaDB](https://img.shields.io/badge/MariaDB-003545?style=for-the-badge&logo=mariadb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)

Plataforma enfocada en la autogestión de pacientes y la administración eficiente de turnos médicos por secretaría. Diseñada con un enfoque estricto en la validación de datos, la privacidad de los usuarios y la mantenibilidad del código.

Proyecto desarrollado para la asignatura "Laboratorio 2" la cual integra conocimientos de desarrollo backend y gestión de bases de datos, para la Universidad de La Punta, San Luis, Argentina.

## 📋 Características Principales

- **Autogestión de Pacientes:** Registro seguro, autenticación y gestión del perfil personal.
- **Administración de Turnos:** Sistema intuitivo para la reserva, visualización y cancelación de citas médicas.
- **Privacidad y Seguridad:** Manejo de datos sensibles mediante encriptación (Bcrypt), autenticación por tokens (JWT) y validación estricta de esquemas.
- **Manejo Seguro de Errores:** Implementación de flujos predecibles para garantizar la estabilidad del sistema y evitar la exposición de datos internos.

## 🛠️ Stack Tecnológico

- **Backend:** Node.js con Express.js.
- **Base de Datos:** MariaDB (gestión local recomendada vía XAMPP).
- **ORM:** Prisma para un acceso a datos tipado y seguro.
- **Frontend (Views):** Nunjucks, estilizado con TailwindCSS y componentes de DaisyUI.
- **Validación y Utilidades:** Zod (esquemas), Neverthrow (manejo de resultados/errores).
- **Calidad y Testing:** Jest, Supertest, ESLint, Prettier y Husky para pre-commit hooks.

## 📚 Documentación Técnica

Para conocer a fondo el modelado de datos y las decisiones detrás de la construcción de este sistema, puedes consultar nuestra documentación extendida:

// TODO: Enlazar Notion Page

En esta documentación encontrarás:

- Consigna del proyecto.
- Decisiones de Arquitectura (Trade-offs, pros y contras).
- Diagramas Entidad-Relación (DER) y de Clases.
- Requisitos Funcionales y No Funcionales.

## 🚀 Instalación y Despliegue Local

### Requisitos Previos

- [Node.js](https://nodejs.org/) (**estrictamente** v20.19.6 o superior)
- [XAMPP](https://www.apachefriends.org/) (o cualquier servidor local de MariaDB/MySQL)
- [pnpm](https://pnpm.io/) (Gestor de paquetes utilizado en el proyecto, aunque también funciona con otros como npm y bun).

### Pasos de Ejecución

1. **Clonar el repositorio:**

```bash
git clone https://github.com/EmanuelAngel/clinica-angel.git
cd clinica-angel
```

2. **Instalar dependencias:**

```bash
pnpm install
```

3. **Configurar la Base de Datos:**
   - Inicia el módulo de **MySQL/MariaDB** desde el panel de control de XAMPP.
   - Copia el archivo de variables de entorno y ajusta las credenciales:
     ```bash
         cp .env.example .env
     ```
     _(Asegúrate de que `DATABASE_URL` apunte a tu instancia local de XAMPP, por ejemplo: `mysql://root:@localhost:3306/clinica_angel`)_

4. **Ejecutar migraciones y poblar la base de datos (Seed):**

```bash
npx prisma migrate dev
pnpm run db:seed
```

5. **Compilar los estilos e Iniciar el servidor:**
   Para compilar Tailwind y correr el servidor en modo desarrollo:

   ```bash
   pnpm run css:build
   pnpm run dev
   ```

   La aplicación estará disponible en `http://localhost:3000` (o el puerto configurado).

## 🧪 Testing

El proyecto cuenta con una suite de pruebas automatizadas. Para ejecutarlas:

```bash
pnpm run test         # Ejecutar tests una vez
pnpm run test:watch   # Ejecutar en modo observación
pnpm run test:cov     # Generar reporte de cobertura
```

## 👨‍💻 Autor

- **Angel Emanuel** - _Desarrollo Fullstack_ - [GitHub](https://github.com/EmanuelAngel)

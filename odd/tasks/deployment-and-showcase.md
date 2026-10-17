# Feature: Deployment & Portfolio Showcase

Preparation and implementation of clinica-angel for production deployment on Render with TiDB Cloud Serverless, 1-Click Demo Login, and portfolio showcase video script.

## Specs

- S1: "Pipeline de build nativo en Render (sin Docker)" - Package.json must include a `build` script running `@tailwindcss/cli` build and `prisma generate`.
- S2: "Conexión y compatibilidad de TiDB Cloud" - Database configuration in `prisma.js` and `env-variables.js` must support remote MySQL/TiDB connection strings with SSL and custom ports.
- S3: "Almacenamiento de archivos en disco efímero con auto-creación" - Ensure `src/_assets/uploads` directory is created on application startup.
- S4: "Diseño de los botones 1-Click Demo Login" - `src/auth/views/login.njk` must feature quick login buttons for Admin, Secretary, Professional, and Patient.
- S5: "Guión del Video Showcase y guía de despliegue" - Detailed guide for TiDB Cloud, Render deployment, database migration/seed execution, and 3-act showcase script.

## Tasks

- [x] T1: (S1) Add `build` script to package.json for Prisma generate and Tailwind CSS build. | route: inline | commit: pending
- [x] T2: (S2) Update Prisma adapter and env validation to support TiDB Cloud SSL connection string and port. | route: inline | commit: pending
- [x] T3: (S3) Ensure uploads directory auto-creation on server boot. | route: inline | commit: pending
- [x] T4: (S4) Add 1-Click Demo Login buttons in `src/auth/views/login.njk`. | route: inline | commit: pending
- [x] T5: (S5) Document TiDB Cloud setup, Render environment variables, database seed commands, and 60-90s video showcase script. | route: inline | commit: pending

## Log

- L1: /grilling Ayudame a desplegar este proyecto. Lo hice hace 1 año aproximadamente, no recuerdo nada pero quiero poner un link a una web de este proyecto en mi portfolio para quien vea el portfolio y esté interesado en probar la app lo pueda hacer. ¿O tal vez conviene tener un video así es más cómodo? No sé, discutamos eso.
- L2: Decided hybrid strategy (Video Showcase + Live Demo), Render Web Service (native Node, no Docker), TiDB Cloud Serverless MySQL, and 1-Click Demo Login.
- L3: User asked "¿odd?" -> initialized ODD task tracking.
- L4: Implemented T1-T4 inline. Verified build pipeline passes cleanly. Created DEPLOYMENT_AND_SHOWCASE.md guide with 3-act video script.

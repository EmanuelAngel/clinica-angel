# ADR-003: Estrategia de Autenticación y Sesiones

## Status

Accepted

## Context and Problem Statement

El sistema requiere autenticación de usuarios mediante usuario y contraseña (sin 2FA ni OAuth, según el alcance definido). La decisión es cómo gestionar las sesiones una vez autenticado: persistencia en base de datos o tokens stateless.

## Decision Drivers

- El sistema no es una API REST pura — tiene endpoints de vistas (SSR) y endpoints JSON.
- El alcance no incluye "cerrar todas las sesiones" ni invalidación inmediata de sesiones.
- El tiempo de desarrollo es acotado (proyecto universitario).
- La asignatura siguiente requiere una REST API con JWT, por lo que practicar ahora tiene valor de aprendizaje.

## Considered Options

- Sesiones en base de datos con cookies
- JWT almacenado en cookie HttpOnly
- OAuth (redes sociales)

## Decision Outcome

Chosen option: **JWT en cookie HttpOnly**, por simplicidad, familiaridad y alineación con la siguiente asignatura. Se almacena en cookie HttpOnly para mitigar XSS. Se es consciente de que en un entorno productivo real, la falta de refresh tokens y de invalidación inmediata sería un compromiso de seguridad aceptado a conciencia dada la naturaleza académica del proyecto.

### Positive Consequences

- Servidor stateless — no requiere almacenar estado de sesión.
- Implementación simple y bien entendida por el equipo.
- Compatible con los principios REST para uso futuro como API pura.

### Negative Consequences

- Sin invalidación inmediata: si un token es comprometido, permanece válido hasta su expiración.
- Sin refresh tokens en esta fase — el usuario debe re-autenticarse cuando el token expira.
- La duración larga del token (necesaria para no incomodar al usuario) es un tradeoff de seguridad asumido explícitamente.
- Si el secreto de firma se compromete, todos los tokens activos dejan de ser seguros.

## Pros and Cons of the Options

### Sesiones en base de datos con cookies

- A favor: permite invalidación inmediata (ej. al cambiar contraseña o "cerrar todas las sesiones").
- A favor: menor carga computacional por request — no requiere verificar firma criptográfica.
- En contra: stateful — no cumple REST (no requerido, pero es una restricción de diseño).
- En contra: MySQL/MariaDB no es óptimo para gestionar sesiones a escala; Redis lo resolvería pero agrega complejidad de infraestructura y hosting.

### JWT en cookie HttpOnly

- A favor: stateless — el servidor no almacena sesiones.
- A favor: alineado con los principios REST.
- A favor: implementación familiar y simple.
- A favor: la cookie HttpOnly mitiga XSS al impedir acceso desde JavaScript del cliente.
- En contra: no hay invalidación inmediata por diseño del estándar.
- En contra: sin refresh tokens, la UX se degrada cuando el token expira.

### OAuth (redes sociales)

- A favor: UX superior para el usuario final.
- A favor: delega la gestión de credenciales al proveedor.
- En contra: el flujo de registro requiere varios pasos para recolectar los datos adicionales necesarios.
- En contra: dependencia de proveedores externos — si uno falla, afecta el acceso.
- En contra: agrega complejidad de configuración innecesaria para el alcance del proyecto.

## References

- [JSON Web Token](https://www.jwt.io/)
- [MariaDB](https://mariadb.org/)
- [Redis](https://redis.io/)

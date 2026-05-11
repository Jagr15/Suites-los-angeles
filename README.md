# Los Angelos POS Web

Aplicación web administrativa construida con Next.js + Convex.

## Requisitos

- Node.js 20+
- npm 10+
- Cuenta/proyecto de Convex

## Configuración

1. Copia variables de entorno:

```bash
cp .env.example .env.local
```

2. Configura los valores reales en `.env.local`:

```bash
NEXT_PUBLIC_CONVEX_URL=https://<tu-deployment>.convex.cloud
CONVEX_SITE_URL=https://<tu-deployment>.convex.cloud
```

### Variables importantes

- `NEXT_PUBLIC_CONVEX_URL`: URL pública que usa el cliente frontend para conectarse a Convex.
- `CONVEX_SITE_URL`: dominio que usa Convex Auth para la configuración del provider.

## Ejecutar proyecto

1. Instalar dependencias:

```bash
npm install
```

2. Iniciar Convex en desarrollo (genera/actualiza API tipada y aplica schema):

```bash
npx convex dev
```

3. Iniciar frontend:

```bash
npm run dev
```

4. Abrir:

- `http://localhost:3000/login`

## Seed inicial (admin)

Con `convex dev` corriendo, ejecuta:

```bash
npx convex run seed:bootstrapAdmin
```

Esto crea/actualiza usuarios de prueba y roles base.

## Scripts

- `npm run dev`: desarrollo Next.js
- `npm run build`: build de producción
- `npm run start`: servir build
- `npm run lint`: lint con ESLint

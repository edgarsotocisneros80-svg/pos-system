# 🚀 Guía de Despliegue - Sistema POS

## Opción 1: Vercel + PlanetScale (Recomendado)

### 1. Preparar repositorio
```bash
git init
git add .
git commit -m "Initial deployment"
git remote add origin https://github.com/tu-usuario/pos-system.git
git push -u origin main
```

### 2. Configurar PlanetScale
1. Crear cuenta en https://planetscale.com
2. Crear nueva database `pos-system`
3. Copiar `DATABASE_URL` de la conexión

### 3. Desplegar en Vercel
1. Ir a https://vercel.com
2. "New Project" → Importar desde GitHub
3. Configurar variables de entorno:
   - `DATABASE_URL`: Tu conexión de PlanetScale
   - `NEXTAUTH_SECRET`: Generar secreto aleatorio
   - `NEXTAUTH_URL`: https://tu-app.vercel.app

### 4. Ejecutar migraciones
```bash
# En local, conectado a PlanetScale
npx prisma db push
```

## Opción 2: Railway (Más simple)

### 1. Preparar repositorio (igual que arriba)

### 2. Desplegar en Railway
1. Ir a https://railway.app
2. "Deploy from GitHub" → Seleccionar repositorio
3. Añadir PostgreSQL database
4. Configurar variables:
   - `DATABASE_URL`: Se genera automáticamente
   - `NEXTAUTH_SECRET`: Secreto aleatorio

### 3. Migrar schema
```bash
# Railway ejecutará automáticamente
npm run build
```

## Variables de entorno necesarias

```env
DATABASE_URL="tu-conexion-db"
NEXTAUTH_SECRET="secreto-aleatorio-largo"
NEXTAUTH_URL="https://tu-dominio.com"
```

## Comandos útiles

```bash
# Generar secreto
openssl rand -base64 32

# Verificar build local
npm run build

# Ejecutar migraciones
npx prisma db push

# Ver logs en producción
vercel logs tu-app
```

## Funcionalidades incluidas en el deploy

✅ Sistema POS completo
✅ Gestión de inventarios
✅ Compras y proveedores  
✅ Cuentas por pagar
✅ Reportes y kardex
✅ Notificaciones automáticas
✅ Exportación a CSV
✅ Código de barras
✅ Base de datos optimizada

## Notas importantes

- El sistema usa SQLite en desarrollo
- Para producción se recomienda PostgreSQL o MySQL
- Las migraciones se ejecutan automáticamente
- Los archivos estáticos se sirven desde CDN
- SSL/HTTPS incluido automáticamente

# 🚨 ARREGLO URGENTE DE DATABASE_URL

## Problema identificado:
- ERROR: `the URL must start with the protocol postgresql:// or postgres://`
- La variable DATABASE_URL no está configurada correctamente en Vercel

## Solución inmediata:

### Opción A: Arreglar Neon
1. Ir a https://console.neon.tech/
2. Tu proyecto → Connection Details
3. Copiar la CONNECTION STRING completa
4. En Vercel → Settings → Environment Variables
5. Editar DATABASE_URL con la URL de Neon

### Opción B: Usar Supabase (más fácil)
1. Ir a https://supabase.com → Create project
2. Settings → Database → Connection string
3. Copiar la URL (formato: postgresql://postgres:password@host:5432/postgres)
4. En Vercel → Settings → Environment Variables
5. DATABASE_URL = la URL de Supabase

### Verificar:
- Acceder a https://tu-app.vercel.app/api/test
- Debe mostrar hasDbUrl: true
- Debe mostrar dbUrlPrefix: postgresql://...

### Después de configurar:
1. Redeploy en Vercel
2. Las APIs dejarán de dar error 500
3. La aplicación funcionará correctamente

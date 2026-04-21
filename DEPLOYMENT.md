# 🚀 Guía de Despliegue Seguro - Academia de Superhéroes

## 📋 Requisitos Previos

- Cuenta de hosting web (Netlify, Vercel, GitHub Pages, Firebase Hosting, etc.)
- HTTPS habilitado (obligatorio para producción)
- Navegador moderno con soporte para ES6+

## 🔐 Configuración de Seguridad

### 1. Variables de Entorno (REQUERIDO)

Copiar `.env.example` a `.env` y configurar:

```bash
# Credenciales admin - CAMBIAR OBLIGATORIAMENTE
ADMIN_USERNAME=tu_usuario_seguro
ADMIN_PASSWORD=tu_contraseña_fuerte_123!

# Seguridad
REQUIRE_HTTPS=true
SESSION_TIMEOUT=3600000
```

**⚠️ IMPORTANTE:** Nunca subir el archivo `.env` a git. Agregar a `.gitignore`.

### 2. Content Security Policy (CSP)

Descomentar y ajustar la línea en `index.html`:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com 'unsafe-inline'; style-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com 'unsafe-inline'; font-src 'self' https://cdnjs.cloudflare.com; img-src 'self' data:;">
```

Ajustar según el hosting utilizado.

### 3. Configuración por Hosting

#### **Netlify**
1. Crear archivo `netlify.toml`:
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Content-Security-Policy = "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com 'unsafe-inline'; style-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com 'unsafe-inline';"
```

2. Configurar variables de entorno en el dashboard

#### **Vercel**
1. Configurar variables de entorno en Project Settings > Environment Variables
2. El build se realiza automáticamente desde git

#### **Firebase Hosting**
1. Configurar `firebase.json`:
```json
{
  "hosting": {
    "public": ".",
    "headers": [
      {
        "source": "**",
        "headers": [
          {
            "key": "Content-Security-Policy",
            "value": "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com 'unsafe-inline';"
          }
        ]
      }
    ]
  }
}
```

#### **GitHub Pages**
- Agregar `_headers` file (si soporta custom headers)
- O usar meta tag CSP en HTML

#### **Hosting Compartido con cPanel**
1. **Comprimir archivos:**
   ```bash
   zip -r superheroes.zip . -x "*.git*" -x "node_modules/*"
   ```

2. **Subir vía cPanel:**
   - Login a cPanel → File Manager
   - Ir a `public_html/` (o subcarpeta como `public_html/superheroes/`)
   - Subir `superheroes.zip` y extraer

3. **Configurar Base de Datos MySQL:**
   - cPanel → MySQL Database Wizard
   - Crear base de datos: `superheroes`
   - Crear usuario MySQL con contraseña segura
   - Asignar todos los privilegios al usuario
   - Importar `database/schema.sql`:
     - phpMyAdmin → Importar → Seleccionar archivo schema.sql

4. **Configurar conexión PHP:**
   - Editar `api/config.php` con credenciales de cPanel:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_USER', 'tu_usuario_mysql');
   define('DB_PASS', 'tu_contraseña_mysql');
   define('DB_NAME', 'tu_usuario_superheroes');
   ```

5. **Activar MySQL en frontend:**
   - Crear archivo `env.js` en servidor:
   ```javascript
   window.ENV = {
     ADMIN_USERNAME: 'tu_usuario',
     ADMIN_PASSWORD: 'tu_contraseña_segura',
     USE_MYSQL: true,
     API_BASE_URL: './api'
   };
   ```

6. **Configurar HTTPS:**
   - cPanel → SSL/TLS → Let's Encrypt (gratuito)
   - Forzar HTTPS redirigiendo HTTP → HTTPS

7. **Variables de entorno:**
   - cPanel no soporta `.env` nativamente
   - Opción A: Crear archivo `env.js` en servidor (excluir de git):
     ```javascript
     window.ENV = {
       ADMIN_USERNAME: 'tu_usuario',
       ADMIN_PASSWORD: 'tu_contraseña_segura'
     };
     ```
   - Opción B: Modificar `js/config.js` directamente con valores de producción
   - **⚠️ Nunca subir `.env` real a hosting compartido**

8. **Proteger archivos sensibles:**
   - Crear `.htaccess` en raíz:
   ```apache
   # Proteger archivos .env
   <FilesMatch "^\.env">
     Order allow,deny
     Deny from all
   </FilesMatch>
   
   # Forzar HTTPS
   RewriteEngine On
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   
   # Headers de seguridad
   Header always set X-Frame-Options "DENY"
   Header always set X-Content-Type-Options "nosniff"
   Header always set X-XSS-Protection "1; mode=block"
   ```

9. **Permisos de archivos:**
   - Carpetas: 755
   - Archivos: 644
   - `config.js`: 644 (o 640 si el servidor lo permite)
   - `api/`: 755 (PHP necesita ejecutar)

## 🗄️ Opciones de Almacenamiento

### Opción 1: LocalStorage (Por Defecto)
- ✅ Fácil de configurar
- ⚠️ Datos se pierden al limpiar navegador
- ⚠️ No sincroniza entre dispositivos

### Opción 2: Firebase (Recomendado para Producción)

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilitar Firestore Database
3. Configurar reglas de seguridad:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /heroes/{heroId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.token.admin == true;
    }
  }
}
```
4. Configurar variables de entorno Firebase
5. Descomentar script en `index.html`:
```html
<script type="module" src="firebase-config.js"></script>
```

## 🔒 Mejores Prácticas

1. **Cambiar credenciales por defecto**
   - El sistema advierte si usas credenciales por defecto
   - Ver en consola del navegador: `window.APP_CONFIG.validate()`

2. **Usar HTTPS siempre**
   - Las cookies y localStorage son vulnerables en HTTP
   - Configurar redirect HTTP → HTTPS

3. **Rotación de contraseñas**
   - Cambiar contraseña admin periódicamente
   - No compartir credenciales entre múltiples usuarios

4. **Backup de datos**
   - Exportar datos de LocalStorage regularmente
   - Usar Firebase para backup automático

## 🐛 Troubleshooting

### "Usando credenciales por defecto"
- Cambiar `ADMIN_USERNAME` y `ADMIN_PASSWORD` en `.env`

### Datos se pierden al recargar
- Verificar que localStorage esté habilitado
- Considerar migrar a Firebase

### Errores CSP
- Ajustar política según recursos externos utilizados
- Ver consola del navegador para errores específicos

## 📞 Soporte

Para problemas de seguridad, revisar:
1. Consola del navegador (F12)
2. Validación: `window.APP_CONFIG.validate()`
3. Documentación del hosting utilizado

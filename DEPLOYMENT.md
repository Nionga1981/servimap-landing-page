# 🚀 Guía de Deployment - ServiMapp Landing Page

Esta guía te ayudará a deployar la landing page de ServiMapp en diferentes plataformas de hosting.

## 📋 Pre-requisitos

- Repositorio en GitHub
- Node.js 14+ instalado (opcional, solo para desarrollo local)
- Cuenta en la plataforma de hosting elegida

## 🌐 Opciones de Hosting

### 1. Netlify (Recomendado) 🥇

**Pros**: Gratis, CI/CD automático, CDN global, SSL gratis, fácil configuración

#### Deployment Automático desde GitHub

1. **Crear cuenta en Netlify**
   - Ve a https://www.netlify.com
   - Regístrate con tu cuenta de GitHub

2. **Conectar repositorio**
   - Click en "Add new site" → "Import an existing project"
   - Selecciona "GitHub"
   - Autoriza a Netlify
   - Selecciona tu repositorio `servimap-landing-page`

3. **Configurar build settings**
   ```
   Build command: (dejar vacío)
   Publish directory: .
   ```

4. **Deploy**
   - Click en "Deploy site"
   - ¡Listo! Tu sitio estará en línea en ~30 segundos

5. **Configurar dominio personalizado (opcional)**
   - Ve a "Domain settings"
   - Agrega tu dominio: `servi-map.com`
   - Sigue las instrucciones para actualizar DNS

#### Deployment con Netlify CLI

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
netlify deploy

# Deploy a producción
netlify deploy --prod
```

---

### 2. Vercel 🚀

**Pros**: Gratis, ultra rápido, excelente CDN, SSL automático

#### Deployment desde GitHub

1. **Crear cuenta en Vercel**
   - Ve a https://vercel.com
   - Regístrate con GitHub

2. **Import project**
   - Click en "Add New" → "Project"
   - Import tu repositorio `servimap-landing-page`

3. **Deploy**
   - Framework Preset: Other
   - Root Directory: ./
   - Click "Deploy"

#### Deployment con Vercel CLI

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy a producción
vercel --prod
```

---

### 3. GitHub Pages 📄

**Pros**: Completamente gratis, integrado con GitHub

#### Configuración

1. **Ir a Settings del repositorio**
   - Ve a tu repositorio en GitHub
   - Click en "Settings"

2. **Configurar Pages**
   - En el menú lateral: "Pages"
   - Source: "Deploy from a branch"
   - Branch: `main` o `master`
   - Folder: `/ (root)`
   - Click "Save"

3. **Acceder al sitio**
   - URL: `https://tuusuario.github.io/servimap-landing-page`

4. **Dominio personalizado (opcional)**
   - En la sección "Custom domain"
   - Agrega: `servi-map.com`
   - Crea un archivo `CNAME` en la raíz con tu dominio

#### CNAME para dominio personalizado

```bash
echo "servi-map.com" > CNAME
git add CNAME
git commit -m "Add CNAME for custom domain"
git push
```

---

### 4. Firebase Hosting 🔥

**Pros**: CDN de Google, integración con otros servicios Firebase

#### Setup Inicial

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar proyecto
firebase init hosting
```

Responde a las preguntas:
- ¿Qué quieres usar? → `Hosting`
- ¿Directorio público? → `.` (raíz)
- ¿SPA? → `No`
- ¿Sobrescribir index.html? → `No`
- ¿GitHub Actions? → `Sí` (si quieres CI/CD automático)

#### Deploy

```bash
# Deploy
firebase deploy --only hosting

# Preview antes de deploy
firebase hosting:channel:deploy preview
```

#### firebase.json

```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(jpg|jpeg|gif|png|svg|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

---

### 5. Cloudflare Pages ☁️

**Pros**: CDN ultra rápido, gratis ilimitado, excelente performance

#### Deployment

1. **Crear cuenta en Cloudflare Pages**
   - Ve a https://pages.cloudflare.com
   - Regístrate

2. **Connect to Git**
   - Conecta tu cuenta de GitHub
   - Selecciona el repositorio

3. **Build settings**
   ```
   Build command: (vacío)
   Build output directory: /
   ```

4. **Deploy**
   - Click "Save and Deploy"

---

### 6. AWS S3 + CloudFront 🌩️

**Pros**: Escalable, control total, integración AWS

#### Setup

```bash
# Instalar AWS CLI
# Configurar credenciales
aws configure

# Crear bucket S3
aws s3 mb s3://servimap-landing

# Configurar como sitio web
aws s3 website s3://servimap-landing \
  --index-document index.html \
  --error-document index.html

# Subir archivos
aws s3 sync . s3://servimap-landing \
  --exclude ".*" \
  --exclude "node_modules/*" \
  --exclude "package.json"

# Configurar permisos públicos
aws s3api put-bucket-policy \
  --bucket servimap-landing \
  --policy file://bucket-policy.json
```

#### bucket-policy.json

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::servimap-landing/*"
    }
  ]
}
```

---

## 🔧 Configuración de Dominio Personalizado

### DNS Settings para servi-map.com

#### Para Netlify/Vercel/Cloudflare

```
Type: A
Name: @
Value: [IP de la plataforma]

Type: CNAME
Name: www
Value: [URL de la plataforma]
```

#### Para GitHub Pages

```
Type: A
Name: @
Value: 185.199.108.153
Value: 185.199.109.153
Value: 185.199.110.153
Value: 185.199.111.153

Type: CNAME
Name: www
Value: tuusuario.github.io
```

---

## 📊 Monitoreo y Analytics

### Google Analytics

Agrega en `index.html` antes de `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### Hotjar

```html
<!-- Hotjar -->
<script>
  (function(h,o,t,j,a,r){
    h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
    h._hjSettings={hjid:XXXXXXX,hjsv:6};
    a=o.getElementsByTagName('head')[0];
    r=o.createElement('script');r.async=1;
    r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
    a.appendChild(r);
  })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
</script>
```

---

## 🚀 CI/CD Automático

### GitHub Actions para Netlify

Crea `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Netlify

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
        with:
          args: deploy --prod --dir=.
```

---

## ✅ Checklist Pre-Deploy

- [ ] Actualizar meta tags (título, descripción, URL)
- [ ] Verificar todas las imágenes cargan correctamente
- [ ] Probar en diferentes dispositivos y navegadores
- [ ] Verificar enlaces externos
- [ ] Configurar Google Analytics
- [ ] Configurar dominio personalizado
- [ ] Verificar SSL/HTTPS
- [ ] Probar velocidad (PageSpeed Insights)
- [ ] Verificar SEO (Google Search Console)

---

## 🆘 Troubleshooting

### Imágenes no cargan

- Verifica que las rutas sean relativas: `assets/images/` no `/images/`
- Revisa que los archivos existan en el repositorio

### 404 en rutas

- Si usas SPA, configura rewrites en tu plataforma
- Para Netlify, crea `netlify.toml`
- Para Vercel, crea `vercel.json`

### Dominio personalizado no funciona

- Verifica DNS propagation: https://dnschecker.org
- Puede tomar 24-48 horas propagar
- Verifica que el CNAME esté correcto

---

## 📞 Soporte

Si tienes problemas con el deployment:

- **Email**: fernandobillard@gmail.com
- **WhatsApp**: +52 667 103 8501
- **Documentación**: Ver `README.md` y `LANDING_PAGE_DOCUMENTATION.md`

---

**Última actualización**: 2025-01-01

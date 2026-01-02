# 🎨 ServiMapp - Landing Page

Landing page profesional y optimizada para **ServiMapp**, el marketplace #1 de servicios locales con geolocalización.

![ServiMapp](assets/images/logobaseok.jpg)

## 🌟 Características

- ✅ **Diseño Mobile-First** - Responsive y optimizado para todos los dispositivos
- ✅ **SEO Optimizado** - Meta tags, Schema markup y Core Web Vitals optimizados
- ✅ **Conversión Dual** - CTAs para clientes y prestadores
- ✅ **Performance** - Lazy loading, preload de recursos críticos
- ✅ **Accesibilidad** - WCAG AA compliance
- ✅ **Animaciones Suaves** - Micro-interacciones y efectos visuales
- ✅ **Trust Signals** - Testimoniales, badges y estadísticas reales

## 📁 Estructura del Proyecto

```
servimap-landing-page/
├── index.html                      # Landing page principal
├── css/
│   └── landing.css                 # Estilos completos
├── js/
│   ├── landing.js                  # Funcionalidad principal
│   └── admin.js                    # Acceso administrativo
├── assets/
│   ├── images/                     # Imágenes y logos
│   │   ├── logobaseok.jpg         # Logo oficial ServiMapp
│   │   ├── app-preview.png        # Preview de la app
│   │   ├── avatar-*.png           # Avatares testimoniales
│   │   └── ...
│   └── icons/                      # Iconos PWA
│       ├── icon-*.jpg             # Diferentes tamaños
│       └── ...
├── LANDING_PAGE_DOCUMENTATION.md   # Documentación completa
├── package.json                    # Configuración del proyecto
└── README.md                       # Este archivo
```

## 🚀 Inicio Rápido

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Nionga1981/servimap-landing-page.git
cd servimap-landing-page

# Instalar dependencias (opcional, solo para servidor de desarrollo)
npm install
```

### Desarrollo Local

```bash
# Iniciar servidor de desarrollo
npm run dev

# O simplemente abrir index.html en tu navegador
```

La landing page estará disponible en `http://localhost:8080`

## 🎨 Personalización

### Colores

Los colores principales están definidos en `css/landing.css`:

```css
:root {
    --primary-color: #209ded;     /* Azul ServiMapp */
    --secondary-color: #10b981;   /* Verde éxito */
    --accent-color: #f59e0b;      /* Amarillo atención */
}
```

### Contenido

Edita `index.html` para modificar:
- Textos y descripciones
- Testimoniales
- Estadísticas
- Enlaces de redes sociales
- Información de contacto

### Imágenes

Reemplaza las imágenes en `assets/images/` manteniendo los mismos nombres de archivo.

## 📱 Secciones Incluidas

1. **Hero Section** - Búsqueda inteligente con geolocalización
2. **Value Propositions** - 6 propuestas de valor diferenciadas
3. **How It Works** - Proceso para clientes y prestadores
4. **Featured Services** - Categorías principales de servicios
5. **Testimonials** - Reseñas y trust badges
6. **Download App** - Descarga de apps móviles
7. **Dual CTA** - Llamados a la acción diferenciados
8. **Footer** - Enlaces, contacto y legal

## 🔧 Tecnologías Utilizadas

- **HTML5** - Estructura semántica
- **CSS3** - Estilos modernos y animaciones
- **JavaScript Vanilla** - Sin dependencias externas
- **Font Awesome 6.4** - Iconografía
- **Google Fonts (Inter)** - Tipografía

## 📊 SEO y Performance

- ✅ Meta tags optimizados (Open Graph, Twitter Cards)
- ✅ Schema markup (LocalBusiness)
- ✅ Sitemap ready
- ✅ Core Web Vitals optimizados
- ✅ Mobile-first indexing
- ✅ Lazy loading de imágenes

## 🌐 Deployment

### Netlify (Recomendado)

1. Conecta tu repositorio de GitHub
2. Build settings: ninguno requerido
3. Publish directory: `.`
4. Deploy!

### Vercel

```bash
npm install -g vercel
vercel
```

### GitHub Pages

1. Ve a Settings > Pages
2. Source: Deploy from a branch
3. Branch: `main` / Root
4. Save

### Firebase Hosting

```bash
firebase init hosting
firebase deploy --only hosting
```

## 📞 Soporte

Para consultas sobre la landing page:

- **Email**: fernandobillard@gmail.com
- **WhatsApp**: +52 667 103 8501
- **Documentación**: Ver `LANDING_PAGE_DOCUMENTATION.md`

## 📝 Licencia

MIT License - Ver archivo LICENSE para más detalles

## 🤝 Contribuciones

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 🏆 Créditos

Desarrollado con ❤️ por el equipo de **ServiMapp**

---

**URL de producción**: https://servi-map.com

**Repositorio principal del proyecto**: https://github.com/Nionga1981/servimap-firebase-functions

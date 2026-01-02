/**
 * ServiMap Landing Page JavaScript
 * Modern, optimized, and accessible interactions
 */

// ==================== GLOBALS & CONSTANTS ====================
const CONSTANTS = {
    SCROLL_THRESHOLD: 100,
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 300,
    API_BASE_URL: 'https://us-central1-servimap-nyniz.cloudfunctions.net',
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
};

const STATE = {
    isMenuOpen: false,
    currentTab: 'client',
    isSearching: false,
    userLocation: null,
    searchTimeout: null
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Debounce function to limit function calls
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function for scroll events
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Show loading overlay
 */
function showLoading(message = 'Cargando...') {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        const loadingText = overlay.querySelector('p');
        if (loadingText) {
            loadingText.textContent = message;
        }
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

/**
 * Show error message
 */
function showError(message, element = null) {
    if (element) {
        element.style.display = 'block';
        element.textContent = message;
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    } else {
        console.error(message);
        // Could integrate with a toast system here
    }
}

/**
 * Animate element into view
 */
function animateOnScroll() {
    const elements = document.querySelectorAll('[data-animate]');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(el => observer.observe(el));
}

// ==================== NAVIGATION ====================

/**
 * Initialize navigation functionality
 */
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Scroll effect on navbar
    const handleScroll = throttle(() => {
        if (window.scrollY > CONSTANTS.SCROLL_THRESHOLD) {
            navbar?.classList.add('scrolled');
        } else {
            navbar?.classList.remove('scrolled');
        }
    }, 100);

    window.addEventListener('scroll', handleScroll);

    // Mobile menu toggle
    navToggle?.addEventListener('click', toggleMobileMenu);
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (STATE.isMenuOpen && !navMenu?.contains(e.target) && !navToggle?.contains(e.target)) {
            closeMobileMenu();
        }
    });

    // Smooth scroll for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const offsetTop = target.offsetTop - 80; // Account for fixed navbar
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                    closeMobileMenu();
                    updateActiveLink(link);
                }
            }
        });
    });

    // Update active link on scroll
    window.addEventListener('scroll', throttle(updateActiveNavigation, 100));
}

/**
 * Toggle mobile menu
 */
function toggleMobileMenu() {
    const navMenu = document.getElementById('nav-menu');
    const navToggle = document.getElementById('nav-toggle');
    
    STATE.isMenuOpen = !STATE.isMenuOpen;
    
    navMenu?.classList.toggle('active');
    navToggle?.classList.toggle('active');
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = STATE.isMenuOpen ? 'hidden' : 'auto';
}

/**
 * Close mobile menu
 */
function closeMobileMenu() {
    const navMenu = document.getElementById('nav-menu');
    const navToggle = document.getElementById('nav-toggle');
    
    STATE.isMenuOpen = false;
    navMenu?.classList.remove('active');
    navToggle?.classList.remove('active');
    document.body.style.overflow = 'auto';
}

/**
 * Update active navigation link
 */
function updateActiveNavigation() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let currentSection = '';
    const scrollPosition = window.scrollY + 100;

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.offsetHeight;
        
        if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            currentSection = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
            link.classList.add('active');
        }
    });
}

/**
 * Update active link manually
 */
function updateActiveLink(activeLink) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
}

// ==================== SEARCH FUNCTIONALITY ====================

/**
 * Get current location
 */
async function getCurrentLocation() {
    const locationInput = document.getElementById('location-search');
    const locationBtn = document.querySelector('.location-btn');
    
    if (!navigator.geolocation) {
        showError('Geolocalización no disponible en este navegador');
        return;
    }

    // Show loading state
    if (locationBtn) {
        locationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        locationBtn.disabled = true;
    }

    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            });
        });

        const { latitude, longitude } = position.coords;
        STATE.userLocation = { lat: latitude, lng: longitude };

        // Reverse geocoding to get address
        const address = await reverseGeocode(latitude, longitude);
        if (locationInput && address) {
            locationInput.value = address;
            locationInput.dispatchEvent(new Event('input')); // Trigger any input handlers
        }

    } catch (error) {
        console.error('Error getting location:', error);
        let errorMessage = 'No se pudo obtener la ubicación';
        
        switch (error.code) {
            case error.PERMISSION_DENIED:
                errorMessage = 'Permiso de ubicación denegado';
                break;
            case error.POSITION_UNAVAILABLE:
                errorMessage = 'Ubicación no disponible';
                break;
            case error.TIMEOUT:
                errorMessage = 'Tiempo de espera agotado';
                break;
        }
        
        showError(errorMessage);
    } finally {
        // Reset button state
        if (locationBtn) {
            locationBtn.innerHTML = '<i class="fas fa-crosshairs"></i>';
            locationBtn.disabled = false;
        }
    }
}

/**
 * Reverse geocoding using a service
 */
async function reverseGeocode(lat, lng) {
    try {
        // Using a free geocoding service (you might want to use Google Maps API in production)
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=es`);
        const data = await response.json();
        
        if (data && data.city) {
            return `${data.city}, ${data.principalSubdivision || data.countryName}`;
        }
        
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`; // Fallback to coordinates
    } catch (error) {
        console.error('Geocoding error:', error);
        return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
}

/**
 * Perform search
 */
async function performSearch() {
    const serviceInput = document.getElementById('service-search');
    const locationInput = document.getElementById('location-search');
    
    const service = serviceInput?.value?.trim();
    const location = locationInput?.value?.trim();
    
    if (!service) {
        showError('Por favor ingresa el servicio que buscas');
        serviceInput?.focus();
        return;
    }
    
    if (!location) {
        showError('Por favor ingresa tu ubicación');
        locationInput?.focus();
        return;
    }

    // Show loading
    showLoading('Buscando profesionales...');
    
    try {
        // Simulate API call (replace with actual API endpoint)
        const searchParams = new URLSearchParams({
            service: service,
            location: location,
            lat: STATE.userLocation?.lat || '',
            lng: STATE.userLocation?.lng || ''
        });

        // Redirect to search results or open modal
        // For now, we'll just show a success message
        setTimeout(() => {
            hideLoading();
            openClientModal();
        }, 1500);
        
    } catch (error) {
        console.error('Search error:', error);
        hideLoading();
        showError('Error en la búsqueda. Inténtalo de nuevo.');
    }
}

/**
 * Search by category
 */
function searchCategory(category) {
    const serviceInput = document.getElementById('service-search');
    if (serviceInput) {
        serviceInput.value = category;
        serviceInput.focus();
    }
}

// ==================== TAB FUNCTIONALITY ====================

/**
 * Show tab content
 */
function showTab(tabName) {
    // Update buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[onclick="showTab('${tabName}')"]`);
    activeBtn?.classList.add('active');
    
    // Update content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    const activeContent = document.getElementById(`tab-${tabName}`);
    activeContent?.classList.add('active');
    
    STATE.currentTab = tabName;
}

// ==================== MODAL FUNCTIONALITY ====================

/**
 * Open modal
 */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Focus first input
        const firstInput = modal.querySelector('input');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }
}

/**
 * Close modal
 */
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        
        // Clear form inputs
        const inputs = modal.querySelectorAll('input');
        inputs.forEach(input => {
            if (input.type !== 'submit' && input.type !== 'button') {
                input.value = '';
            }
        });
        
        // Hide error messages
        const errorElements = modal.querySelectorAll('.error-message');
        errorElements.forEach(error => error.style.display = 'none');
    }
}

/**
 * Open client modal
 */
function openClientModal() {
    openModal('client-modal');
}

/**
 * Open provider modal
 */
function openProviderModal() {
    openModal('provider-modal');
}

/**
 * Redirect to provider signup
 */
function redirectToProviderSignup() {
    // You can replace this with the actual signup URL
    window.open('/provider-signup', '_blank');
}

/**
 * Open provider signup modal
 */
function openProviderSignup() {
    openProviderModal();
}

/**
 * View all services
 */
function viewAllServices() {
    // Scroll to services section or open services modal
    const servicesSection = document.getElementById('servicios');
    if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// ==================== ADMIN FUNCTIONALITY ====================

/**
 * Show admin login modal
 */
function showAdminLogin() {
    openModal('admin-login-modal');
}

/**
 * Initialize admin login form
 */
function initAdminLogin() {
    const form = document.getElementById('admin-login-form');
    const errorElement = document.getElementById('login-error');
    
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('admin-email')?.value;
        const password = document.getElementById('admin-password')?.value;
        
        if (!email || !password) {
            showError('Por favor completa todos los campos', errorElement);
            return;
        }
        
        showLoading('Verificando credenciales...');
        
        try {
            // Use Firebase Auth or your authentication system
            if (typeof firebase !== 'undefined' && firebase.auth) {
                const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
                const user = userCredential.user;
                
                // Check if user is admin
                const token = await user.getIdTokenResult();
                if (token.claims.admin) {
                    // Redirect to admin panel
                    window.location.href = '/admin.html';
                } else {
                    throw new Error('No tienes permisos de administrador');
                }
            } else {
                throw new Error('Firebase no está disponible');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError(error.message || 'Error de autenticación', errorElement);
        } finally {
            hideLoading();
        }
    });
}

// ==================== PERFORMANCE OPTIMIZATIONS ====================

/**
 * Lazy load images
 */
function initLazyLoading() {
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });

        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
}

/**
 * Preload critical resources
 */
function preloadCriticalResources() {
    const criticalImages = [
        '/images/hero-illustration.svg',
        '/images/app-preview.png',
        '/images/logo.svg'
    ];

    criticalImages.forEach(src => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
    });
}

// ==================== ANALYTICS & TRACKING ====================

/**
 * Track user interactions
 */
function trackEvent(eventName, properties = {}) {
    // Integrate with your analytics service (Google Analytics, Mixpanel, etc.)
    if (typeof gtag !== 'undefined') {
        gtag('event', eventName, properties);
    }
    
    console.log('Event tracked:', eventName, properties);
}

/**
 * Track CTA clicks
 */
function trackCTAClick(ctaType, location) {
    trackEvent('cta_click', {
        type: ctaType,
        location: location,
        timestamp: new Date().toISOString()
    });
}

// ==================== INITIALIZATION ====================

/**
 * Initialize all functionality when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Core functionality
    initNavigation();
    initAdminLogin();
    initLazyLoading();
    animateOnScroll();
    preloadCriticalResources();

    // Inicializar calculadora de meta con valor por defecto (15,000 pesos)
    // Esto generará las 3 estrategias y aplicará la balanceada automáticamente
    setTimeout(() => {
        calculateGoal();
    }, 500); // Pequeño delay para asegurar que el DOM esté completamente cargado

    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal.active');
            if (activeModal) {
                closeModal(activeModal.id);
            }
        }
    });

    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal(e.target.id);
        }
    });
    
    // Add smooth scroll behavior for all anchor links
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const offsetTop = target.offsetTop - 80;
                    window.scrollTo({
                        top: offsetTop,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
    
    // Initialize search functionality
    const searchBtn = document.querySelector('.search-btn');
    searchBtn?.addEventListener('click', performSearch);
    
    // Add enter key support for search
    const searchInputs = document.querySelectorAll('#service-search, #location-search');
    searchInputs.forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
    });
    
    // Track page load
    trackEvent('page_view', {
        page: 'landing',
        referrer: document.referrer,
        user_agent: navigator.userAgent
    });
    
    console.log('ServiMap Landing Page initialized successfully');
});

// ==================== SERVICE WORKER REGISTRATION ====================

/**
 * Register service worker for PWA functionality
 */
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('ServiceWorker registered successfully:', registration.scope);
        } catch (error) {
            console.log('ServiceWorker registration failed:', error);
        }
    });
}

// ==================== ERROR HANDLING ====================

/**
 * Global error handler
 */
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    trackEvent('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
});

/**
 * Unhandled promise rejection handler
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    trackEvent('promise_rejection', {
        reason: event.reason?.toString() || 'Unknown error'
    });
});

// ==================== ECOSYSTEM FUNCTIONALITY ====================

/**
 * Show ecosystem tab
 */
function showEcosystemTab(tabName) {
    // Remove active from all tabs
    document.querySelectorAll('.eco-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Remove active from all content
    document.querySelectorAll('.eco-content').forEach(content => {
        content.classList.remove('active');
    });

    // Add active to clicked tab
    const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
    activeTab?.classList.add('active');

    // Add active to corresponding content
    const activeContent = document.getElementById(tabName);
    activeContent?.classList.add('active');

    // Track event
    trackEvent('ecosystem_tab_switch', {
        tab: tabName
    });
}

/**
 * Sincronizar usuarios y prestadores automáticamente cuando cambian negocios
 */
function syncFromNegocios() {
    const negociosFijos = parseInt(document.getElementById('negocios-input')?.value || 0);

    // Sistema de Cuotas: 16 usuarios + 4 prestadores por cada negocio
    const USUARIOS_POR_NEGOCIO = 16;
    const PRESTADORES_POR_NEGOCIO = 4;

    // Calcular usuarios y prestadores necesarios
    const usuariosNecesarios = negociosFijos * USUARIOS_POR_NEGOCIO;
    const prestadoresNecesarios = negociosFijos * PRESTADORES_POR_NEGOCIO;

    // Actualizar sliders
    const usuariosInput = document.getElementById('usuarios-input');
    const prestadoresInput = document.getElementById('prestadores-input');

    if (usuariosInput) {
        usuariosInput.value = usuariosNecesarios;
    }

    if (prestadoresInput) {
        prestadoresInput.value = prestadoresNecesarios;
    }

    // Calcular earnings con los nuevos valores
    calculateEarnings();
}

/**
 * Sincronizar negocios y prestadores automáticamente cuando cambian usuarios
 */
function syncFromUsuarios() {
    const usuariosActivos = parseInt(document.getElementById('usuarios-input')?.value || 0);
    const negociosFijos = parseInt(document.getElementById('negocios-input')?.value || 0);

    // Sistema de Cuotas: 16 usuarios por cada negocio
    const USUARIOS_POR_NEGOCIO = 16;

    // Calcular mínimo requerido de usuarios basado en negocios
    const usuariosMinimos = negociosFijos * USUARIOS_POR_NEGOCIO;

    // Validar que no baje del mínimo requerido (pero permitir exceder)
    const usuariosInput = document.getElementById('usuarios-input');
    if (usuariosInput && usuariosActivos < usuariosMinimos) {
        usuariosInput.value = usuariosMinimos;
    }

    // Calcular earnings con los nuevos valores
    calculateEarnings();
}

/**
 * Sincronizar negocios y usuarios automáticamente cuando cambian prestadores
 */
function syncFromPrestadores() {
    const prestadoresActivos = parseInt(document.getElementById('prestadores-input')?.value || 0);
    const negociosFijos = parseInt(document.getElementById('negocios-input')?.value || 0);

    // Sistema de Cuotas: 4 prestadores por cada negocio
    const PRESTADORES_POR_NEGOCIO = 4;

    // Calcular mínimo requerido de prestadores basado en negocios
    const prestadoresMinimos = negociosFijos * PRESTADORES_POR_NEGOCIO;

    // Validar que no baje del mínimo requerido (pero permitir exceder)
    const prestadoresInput = document.getElementById('prestadores-input');
    if (prestadoresInput && prestadoresActivos < prestadoresMinimos) {
        prestadoresInput.value = prestadoresMinimos;
    }

    // Calcular earnings con los nuevos valores
    calculateEarnings();
}

/**
 * Calculate ambassador earnings - VERSIÓN SIMPLIFICADA CON VALORES FIJOS
 */
function calculateEarnings() {
    // Obtener valores de los controles (solo los 3 sliders que quedaron)
    const negociosFijos = parseInt(document.getElementById('negocios-input')?.value || 0);
    const usuariosActivos = parseInt(document.getElementById('usuarios-input')?.value || 0);
    const prestadoresActivos = parseInt(document.getElementById('prestadores-input')?.value || 0);

    // Valores fijos según los supuestos del sistema
    const porcentajeUsuariosActivos = 25; // 25% de usuarios activos (fijo)
    const porcentajePrestadoresActivos = 25; // 25% de prestadores activos (fijo)
    const porcentajePremium = 30; // 30% se vuelve premium (fijo)
    const tasaCoincidencia = 10; // 10% de coincidencia (fijo)

    // Actualizar displays de valores (solo los 3 sliders que quedaron)
    if (document.getElementById('negocios-value')) document.getElementById('negocios-value').textContent = negociosFijos;
    if (document.getElementById('usuarios-value')) document.getElementById('usuarios-value').textContent = usuariosActivos;
    if (document.getElementById('prestadores-value')) document.getElementById('prestadores-value').textContent = prestadoresActivos;

    // ============ CÁLCULOS DIRECTOS ============

    // Constantes
    const COMISION_POR_NEGOCIO = 200; // $200 MXN/mes
    const TICKET_PROMEDIO = 1000; // $1,000 MXN
    const COMISION_TRANSACCION_NORMAL = 0.01; // 1% cuando solo registraste uno
    const COMISION_TRANSACCION_DOBLE = 0.02; // 2% cuando registraste ambos
    const COSTO_PREMIUM = 99; // $99 MXN/mes
    const COMISION_PREMIUM = 0.40; // 40%

    // Sistema de Cuotas (según quotaSystem.ts)
    const USUARIOS_POR_NEGOCIO = 16; // Usuarios requeridos por negocio
    const PRESTADORES_POR_NEGOCIO = 4; // Prestadores requeridos por negocio

    // 1. Comisión por Negocios Fijos (CON SISTEMA DE CUOTAS)

    // Calcular cuota elegible (cuántos negocios puedes cobrar)
    const usuariosUnits = Math.floor(usuariosActivos / USUARIOS_POR_NEGOCIO);
    const prestadoresUnits = Math.floor(prestadoresActivos / PRESTADORES_POR_NEGOCIO);
    const quotaEligible = Math.min(usuariosUnits, prestadoresUnits);

    // Separar negocios cobrables vs pendientes
    const negociosCobrables = Math.min(negociosFijos, quotaEligible);
    const negociosPendientes = Math.max(0, negociosFijos - quotaEligible);

    // Comisión inmediata (solo por negocios cobrables)
    const comisionNegociosCobrables = negociosCobrables * COMISION_POR_NEGOCIO;

    // Comisión pendiente (se liberará al cumplir cuota)
    const comisionNegociosPendientes = negociosPendientes * COMISION_POR_NEGOCIO;

    // Total (para mostrar potencial completo)
    const comisionNegociosFijos = negociosFijos * COMISION_POR_NEGOCIO;

    // 2. Comisión por Transacciones (CON % ACTIVOS Y TASA DE COINCIDENCIA)
    // Calcular usuarios/prestadores activos que hacen 1 transacción al mes
    const usuariosActivosMes = Math.round(usuariosActivos * (porcentajeUsuariosActivos / 100));
    const prestadoresActivosMes = Math.round(prestadoresActivos * (porcentajePrestadoresActivos / 100));

    // Cada activo hace exactamente 1 transacción al mes
    const transaccionesUsuarios = usuariosActivosMes * 1;
    const transaccionesPrestadores = prestadoresActivosMes * 1;
    const totalTransacciones = transaccionesUsuarios + transaccionesPrestadores;

    // Porcentaje de transacciones con coincidencia (registraste ambos: usuario + prestador)
    const tasaCoincidenciaDecimal = tasaCoincidencia / 100;

    // Transacciones con coincidencia (2% comisión)
    const transaccionesConCoincidencia = totalTransacciones * tasaCoincidenciaDecimal;
    const comisionConCoincidencia = transaccionesConCoincidencia * TICKET_PROMEDIO * COMISION_TRANSACCION_DOBLE;

    // Transacciones sin coincidencia (1% comisión)
    const transaccionesSinCoincidencia = totalTransacciones * (1 - tasaCoincidenciaDecimal);
    const comisionSinCoincidencia = transaccionesSinCoincidencia * TICKET_PROMEDIO * COMISION_TRANSACCION_NORMAL;

    // Total de comisiones por transacciones
    const comisionTransacciones = comisionConCoincidencia + comisionSinCoincidencia;

    // Separar para el desglose UI (proporcional)
    const proporcionUsuarios = totalTransacciones > 0 ? transaccionesUsuarios / totalTransacciones : 0;
    const proporcionPrestadores = totalTransacciones > 0 ? transaccionesPrestadores / totalTransacciones : 0;
    const comisionUsuarios = comisionTransacciones * proporcionUsuarios;
    const comisionPrestadores = comisionTransacciones * proporcionPrestadores;

    // 3. Comisión por Membresías Premium
    // Calcular usuarios premium como % del total de registrados (usuarios + prestadores)
    const totalRegistrados = usuariosActivos + prestadoresActivos;
    const usuariosPremium = Math.round(totalRegistrados * (porcentajePremium / 100));
    const comisionMembresiasPremium = usuariosPremium * COSTO_PREMIUM * COMISION_PREMIUM;

    // ============ TOTAL MENSUAL ============
    // Solo incluir comisiones cobrables inmediatas (no las pendientes de cuota)
    const monthlyEarnings = comisionNegociosCobrables + comisionTransacciones + comisionMembresiasPremium;
    const traditionalSalary = 10000; // Salario tradicional promedio en México
    const difference = monthlyEarnings - traditionalSalary;

    // ============ ACTUALIZAR UI ============
    const monthlyIncomeEl = document.getElementById('monthly-income');
    const extraIncomeEl = document.getElementById('extra-income');

    if (monthlyIncomeEl) {
        monthlyIncomeEl.textContent = `$${Math.round(monthlyEarnings).toLocaleString()} MXN`;
    }

    if (extraIncomeEl) {
        if (difference >= 0) {
            extraIncomeEl.textContent = `+$${Math.round(difference).toLocaleString()} MXN`;
            extraIncomeEl.style.color = '#10b981'; // Verde
        } else {
            extraIncomeEl.textContent = `-$${Math.round(Math.abs(difference)).toLocaleString()} MXN`;
            extraIncomeEl.style.color = '#ef4444'; // Rojo
        }
    }

    // Actualizar desglose detallado
    const negociosIncomeEl = document.getElementById('negocios-income');
    const usuariosIncomeEl = document.getElementById('usuarios-income');
    const prestadoresIncomeEl = document.getElementById('prestadores-income');
    const premiumIncomeEl = document.getElementById('premium-income');

    // Mostrar comisiones cobrables (sin advertencias)
    if (negociosIncomeEl) negociosIncomeEl.textContent = `$${Math.round(comisionNegociosCobrables).toLocaleString()}`;
    if (usuariosIncomeEl) usuariosIncomeEl.textContent = `$${Math.round(comisionUsuarios).toLocaleString()}`;
    if (prestadoresIncomeEl) prestadoresIncomeEl.textContent = `$${Math.round(comisionPrestadores).toLocaleString()}`;
    if (premiumIncomeEl) premiumIncomeEl.textContent = `$${Math.round(comisionMembresiasPremium).toLocaleString()}`;

    // Track calculation
    trackEvent('ambassador_calculator_interactive', {
        negocios_fijos: negociosFijos,
        usuarios_activos: usuariosActivos,
        servicios_por_usuario: serviciosPorUsuario,
        prestadores_activos: prestadoresActivos,
        servicios_por_prestador: serviciosPorPrestador,
        usuarios_premium: usuariosPremium,
        tasa_coincidencia: tasaCoincidencia,
        comision_negocios: Math.round(comisionNegociosFijos),
        comision_usuarios: Math.round(comisionUsuarios),
        comision_prestadores: Math.round(comisionPrestadores),
        comision_premium: Math.round(comisionMembresiasPremium),
        comision_con_coincidencia: Math.round(comisionConCoincidencia),
        comision_sin_coincidencia: Math.round(comisionSinCoincidencia),
        total_earnings: Math.round(monthlyEarnings)
    });
}

/**
 * Aplicar escenario predefinido
 */
function applyScenario(scenario) {
    const scenarios = {
        conservador: {
            negocios: 1,
            usuarios: 16, // 1 × 16
            porcentajeUsuariosActivos: 20, // 20% de usuarios hacen 1 transacción/mes
            prestadores: 4, // 1 × 4
            porcentajePrestadoresActivos: 25, // 25% de prestadores hacen 1 servicio/mes
            premium: 10, // 10% del total de registrados
            coincidencia: 20 // 20% - Inicio, pocas coincidencias
        },
        moderado: {
            negocios: 10,
            usuarios: 160, // 10 × 16
            porcentajeUsuariosActivos: 30, // 30% de usuarios hacen 1 transacción/mes
            prestadores: 40, // 10 × 4
            porcentajePrestadoresActivos: 35, // 35% de prestadores hacen 1 servicio/mes
            premium: 15, // 15% del total de registrados
            coincidencia: 40 // 40% - Red establecida
        },
        optimista: {
            negocios: 30,
            usuarios: 480, // 30 × 16
            porcentajeUsuariosActivos: 40, // 40% de usuarios hacen 1 transacción/mes
            prestadores: 120, // 30 × 4
            porcentajePrestadoresActivos: 45, // 45% de prestadores hacen 1 servicio/mes
            premium: 20, // 20% del total de registrados
            coincidencia: 50 // 50% - Buena red
        },
        'full-time': {
            negocios: 110,
            usuarios: 1760, // 110 × 16
            porcentajeUsuariosActivos: 35, // 35% de usuarios hacen 1 transacción/mes
            prestadores: 440, // 110 × 4
            porcentajePrestadoresActivos: 40, // 40% de prestadores hacen 1 servicio/mes
            premium: 25, // 25% del total de registrados
            coincidencia: 60 // 60% - Dedicación completa, mejor networking
        },
        'enfoque-negocios': {
            negocios: 100,
            usuarios: 1600, // 100 × 16
            porcentajeUsuariosActivos: 25, // 25% de usuarios - enfoque B2B
            prestadores: 400, // 100 × 4
            porcentajePrestadoresActivos: 30, // 30% de prestadores - enfoque B2B
            premium: 15, // 15% del total de registrados
            coincidencia: 30 // 30% - Enfoque B2B
        },
        'enfoque-volumen': {
            negocios: 20,
            usuarios: 2500, // Muchos más usuarios que lo requerido (20×16=320)
            porcentajeUsuariosActivos: 50, // 50% de usuarios - alto volumen activo
            prestadores: 800, // Muchos más prestadores (20×4=80)
            porcentajePrestadoresActivos: 55, // 55% de prestadores - alto volumen activo
            premium: 30, // 30% del total de registrados - alto volumen facilita conversión
            coincidencia: 45 // 45% - Alto volumen, muchas transacciones
        }
    };

    const config = scenarios[scenario];
    if (!config) return;

    // Actualizar valores
    if (document.getElementById('negocios-input')) document.getElementById('negocios-input').value = config.negocios;
    if (document.getElementById('usuarios-input')) document.getElementById('usuarios-input').value = config.usuarios;
    if (document.getElementById('servicios-usuario-input')) document.getElementById('servicios-usuario-input').value = config.porcentajeUsuariosActivos;
    if (document.getElementById('prestadores-input')) document.getElementById('prestadores-input').value = config.prestadores;
    if (document.getElementById('servicios-prestador-input')) document.getElementById('servicios-prestador-input').value = config.porcentajePrestadoresActivos;
    if (document.getElementById('premium-input')) document.getElementById('premium-input').value = config.premium;
    if (document.getElementById('coincidencia-input')) document.getElementById('coincidencia-input').value = config.coincidencia;

    // Recalcular
    calculateEarnings();

    // Track scenario selection
    trackEvent('calculator_scenario_applied', { scenario });
}

/**
 * Show download modal
 */
function showDownloadModal() {
    // Create simple download modal
    const modal = document.createElement('div');
    modal.className = 'modal download-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-mobile-alt"></i> Descarga ServiMapp</h3>
                <button class="modal-close" onclick="closeDownloadModal()">&times;</button>
            </div>
            <div class="modal-body">
                <p>¡La app ServiMapp estará disponible muy pronto!</p>
                <div class="download-notice">
                    <i class="fas fa-info-circle"></i>
                    <span>Héctor está trabajando en la versión final. Pronto podrás descargarla desde:</span>
                </div>
                <div class="store-buttons">
                    <div class="store-btn disabled">
                        <i class="fab fa-apple"></i>
                        <span>App Store</span>
                        <small>Próximamente</small>
                    </div>
                    <div class="store-btn disabled">
                        <i class="fab fa-google-play"></i>
                        <span>Google Play</span>
                        <small>Próximamente</small>
                    </div>
                </div>
                <div class="progress-info">
                    <h4>Estado del Desarrollo:</h4>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 60%"></div>
                    </div>
                    <span>60% Completado - FlutterFlow</span>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    trackEvent('download_modal_shown');
}

/**
 * Close download modal
 */
function closeDownloadModal() {
    const modal = document.querySelector('.download-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

/**
 * Show contact modal for business
 */
function showContactModal() {
    const modal = document.createElement('div');
    modal.className = 'modal contact-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-handshake"></i> Contacto Empresarial</h3>
                <button class="modal-close" onclick="closeContactModal()">&times;</button>
            </div>
            <div class="modal-body">
                <p>¿Interesado en soluciones empresariales? ¡Contactanos!</p>
                <div class="contact-info">
                    <div class="contact-item">
                        <i class="fas fa-envelope"></i>
                        <span>fernandobillard@gmail.com</span>
                    </div>
                    <div class="contact-item">
                        <i class="fab fa-whatsapp"></i>
                        <span>+52 667 103 8501</span>
                    </div>
                </div>
                <div class="business-note">
                    <i class="fas fa-building"></i>
                    <span>Planes empresariales desde $99/mes con funciones avanzadas</span>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    trackEvent('contact_modal_shown');
}

/**
 * Close contact modal
 */
function closeContactModal() {
    const modal = document.querySelector('.contact-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

/**
 * Show ambassador modal
 */
function showAmbassadorModal() {
    const modal = document.createElement('div');
    modal.className = 'modal ambassador-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3><i class="fas fa-crown"></i> Programa de Embajadores</h3>
                <button class="modal-close" onclick="closeAmbassadorModal()">&times;</button>
            </div>
            <div class="modal-body">
                <p>¡Únete al programa más rentable de ServiMapp!</p>
                <div class="ambassador-benefits">
                    <div class="benefit">
                        <i class="fas fa-dollar-sign"></i>
                        <span>40% comisión permanente</span>
                    </div>
                    <div class="benefit">
                        <i class="fas fa-infinity"></i>
                        <span>Ingresos recurrentes sin límite</span>
                    </div>
                    <div class="benefit">
                        <i class="fas fa-chart-line"></i>
                        <span>$20,000+ primer mes realista</span>
                    </div>
                </div>
                <div class="contact-cta">
                    <p>Contáctanos para más información:</p>
                    <a href="https://wa.me/526671038501" class="whatsapp-btn" target="_blank">
                        <i class="fab fa-whatsapp"></i>
                        WhatsApp
                    </a>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    trackEvent('ambassador_modal_shown');
}

/**
 * Close ambassador modal
 */
function closeAmbassadorModal() {
    const modal = document.querySelector('.ambassador-modal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

// ==================== EVENT LISTENERS ====================

// Ecosystem tabs
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners to ecosystem tabs
    document.querySelectorAll('.eco-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            showEcosystemTab(tabName);
        });
    });

    // Initialize ambassador calculator if present
    const referidosSlider = document.getElementById('referidos');
    if (referidosSlider) {
        calculateEarnings(); // Set initial values
    }

    // Close modals when clicking outside
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            if (e.target.classList.contains('download-modal')) {
                closeDownloadModal();
            } else if (e.target.classList.contains('contact-modal')) {
                closeContactModal();
            } else if (e.target.classList.contains('ambassador-modal')) {
                closeAmbassadorModal();
            }
        }
    });
});

/**
 * Calcular meta inversa - cuántos referidos necesito para alcanzar un objetivo
 */
function calculateGoal() {
    const goalInput = document.getElementById('goal-input');
    if (!goalInput) return;

    const goalAmount = parseInt(goalInput.value) || 0;
    console.log('Calculando meta para:', goalAmount);

    // Generar 3 estrategias diferentes para alcanzar la meta
    const strategy1 = calculateStrategy(goalAmount, 0.70, 0.15, 0.15, 15, 30, 25, 30); // Enfoque Negocios - 15% premium, 30% coincidencia, 25% usuarios activos, 30% prestadores activos
    const strategy2 = calculateStrategy(goalAmount, 0.40, 0.30, 0.30, 20, 40, 30, 35); // Balanceada - 20% premium, 40% coincidencia, 30% usuarios activos, 35% prestadores activos
    const strategy3 = calculateStrategy(goalAmount, 0.20, 0.40, 0.40, 25, 50, 40, 45); // Enfoque Volumen - 25% premium, 50% coincidencia, 40% usuarios activos, 45% prestadores activos

    // Actualizar UI con las estrategias
    updateGoalStrategies(strategy1, strategy2, strategy3, goalAmount);

    // Aplicar automáticamente la estrategia BALANCEADA (strategy2) a los sliders
    // skipScroll = true para evitar scroll automático durante carga inicial
    applyGoalStrategy(
        strategy2.negocios,
        strategy2.usuarios,
        strategy2.porcentajeUsuariosActivos,
        strategy2.prestadores,
        strategy2.porcentajePrestadoresActivos,
        strategy2.premiumPct,  // Usar el PORCENTAJE, no el número calculado
        strategy2.coincidencia,
        true  // skipScroll = true
    );

    // Track goal calculation
    trackEvent('calculator_goal_calculated', { goal_amount: goalAmount });
}

/**
 * Calcular estrategia basada en distribución de ingresos
 */
function calculateStrategy(goalAmount, negociosPct, usuariosPct, prestadoresPct, premiumPct, coincidenciaPct = 40, porcentajeUsuariosActivos = 30, porcentajePrestadoresActivos = 30) {
    const COMISION_POR_NEGOCIO = 200;
    const TICKET_PROMEDIO = 1000;
    const COMISION_TRANSACCION = 0.01;
    const COSTO_PREMIUM = 99;
    const COMISION_PREMIUM = 0.40;
    const USUARIOS_POR_NEGOCIO = 16;
    const PRESTADORES_POR_NEGOCIO = 4;

    // IMPORTANTE: Sistema de cuotas SIEMPRE respeta la proporción 16:4:1
    // Si tienes N negocios, DEBES tener N×16 usuarios y N×4 prestadores

    let multiplier = 1;
    let negocios, usuarios, prestadores, premium;
    let totalReal = 0;

    // Intentar hasta 20 iteraciones para encontrar combinación cercana
    for (let i = 0; i < 20; i++) {
        // Calcular negocios basados en porcentaje del goal
        negocios = Math.ceil((goalAmount * negociosPct * multiplier) / COMISION_POR_NEGOCIO);

        // REGLA ESTRICTA: Usuarios y prestadores SIEMPRE sincronizados con negocios
        usuarios = negocios * USUARIOS_POR_NEGOCIO;
        prestadores = negocios * PRESTADORES_POR_NEGOCIO;

        // Premium como % del total registrados
        const totalRegistrados = usuarios + prestadores;
        premium = Math.round(totalRegistrados * (premiumPct / 100));

        // Calcular ingresos reales con estas proporciones
        const usuariosActivosMes = Math.round(usuarios * (porcentajeUsuariosActivos / 100));
        const prestadoresActivosMes = Math.round(prestadores * (porcentajePrestadoresActivos / 100));

        const ingresosNegocios = negocios * COMISION_POR_NEGOCIO;
        const ingresosUsuarios = usuariosActivosMes * 1 * TICKET_PROMEDIO * COMISION_TRANSACCION;
        const ingresosPrestadores = prestadoresActivosMes * 1 * TICKET_PROMEDIO * COMISION_TRANSACCION;
        const ingresosPremium = premium * COSTO_PREMIUM * COMISION_PREMIUM;

        totalReal = ingresosNegocios + ingresosUsuarios + ingresosPrestadores + ingresosPremium;

        // Si alcanzamos o superamos el goal, terminamos
        if (totalReal >= goalAmount * 0.95) break; // 95% tolerancia

        // Si estamos muy por debajo, incrementar negocios (y con ello usuarios/prestadores)
        multiplier *= 1.15;
    }

    // Calcular ingresos finales para retorno
    const usuariosActivosMes = Math.round(usuarios * (porcentajeUsuariosActivos / 100));
    const prestadoresActivosMes = Math.round(prestadores * (porcentajePrestadoresActivos / 100));

    const ingresosReales = {
        negocios: negocios * COMISION_POR_NEGOCIO,
        usuarios: usuariosActivosMes * 1 * TICKET_PROMEDIO * COMISION_TRANSACCION,
        prestadores: prestadoresActivosMes * 1 * TICKET_PROMEDIO * COMISION_TRANSACCION,
        premium: premium * COSTO_PREMIUM * COMISION_PREMIUM
    };

    return {
        negocios: negocios,
        usuarios: usuarios,
        porcentajeUsuariosActivos: porcentajeUsuariosActivos,
        prestadores: prestadores,
        porcentajePrestadoresActivos: porcentajePrestadoresActivos,
        premium: premium,  // Número de usuarios premium
        premiumPct: premiumPct,  // Porcentaje de premium para el slider
        coincidencia: coincidenciaPct,
        total: Math.round(totalReal),
        ingresos: ingresosReales
    };
}

/**
 * Actualizar UI con estrategias de meta
 */
function updateGoalStrategies(strategy1, strategy2, strategy3, goalAmount) {
    const container = document.getElementById('goal-strategies');
    if (!container) return;

    container.innerHTML = `
        <div class="goal-header">
            <h4>🎯 Para alcanzar $${goalAmount.toLocaleString()} MXN/mes, puedes usar estas estrategias:</h4>
        </div>

        <div class="strategies-grid">
            <div class="strategy-card">
                <div class="strategy-header">
                    <div class="strategy-icon">🏢</div>
                    <div class="strategy-title">Enfoque Negocios</div>
                </div>
                <div class="strategy-body">
                    <div class="strategy-stat">
                        <i class="fas fa-building"></i>
                        <span>${strategy1.negocios} negocios</span>
                        <span class="stat-value">$${Math.round(strategy1.ingresos.negocios).toLocaleString()}</span>
                    </div>
                    <div class="strategy-stat">
                        <i class="fas fa-user"></i>
                        <span>${strategy1.usuarios} usuarios</span>
                        <span class="stat-value">$${Math.round(strategy1.ingresos.usuarios).toLocaleString()}</span>
                    </div>
                    <div class="strategy-stat">
                        <i class="fas fa-tools"></i>
                        <span>${strategy1.prestadores} prestadores</span>
                        <span class="stat-value">$${Math.round(strategy1.ingresos.prestadores).toLocaleString()}</span>
                    </div>
                    <div class="strategy-stat">
                        <i class="fas fa-crown"></i>
                        <span>${strategy1.premium} premium</span>
                        <span class="stat-value">$${Math.round(strategy1.ingresos.premium).toLocaleString()}</span>
                    </div>
                </div>
                <div class="strategy-footer">
                    <div class="strategy-total">Total: $${strategy1.total.toLocaleString()}</div>
                </div>
            </div>

            <div class="strategy-card featured">
                <div class="strategy-badge">Recomendada</div>
                <div class="strategy-header">
                    <div class="strategy-icon">⚖️</div>
                    <div class="strategy-title">Balanceada</div>
                </div>
                <div class="strategy-body">
                    <div class="strategy-stat">
                        <i class="fas fa-building"></i>
                        <span>${strategy2.negocios} negocios</span>
                        <span class="stat-value">$${Math.round(strategy2.ingresos.negocios).toLocaleString()}</span>
                    </div>
                    <div class="strategy-stat">
                        <i class="fas fa-user"></i>
                        <span>${strategy2.usuarios} usuarios</span>
                        <span class="stat-value">$${Math.round(strategy2.ingresos.usuarios).toLocaleString()}</span>
                    </div>
                    <div class="strategy-stat">
                        <i class="fas fa-tools"></i>
                        <span>${strategy2.prestadores} prestadores</span>
                        <span class="stat-value">$${Math.round(strategy2.ingresos.prestadores).toLocaleString()}</span>
                    </div>
                    <div class="strategy-stat">
                        <i class="fas fa-crown"></i>
                        <span>${strategy2.premium} premium</span>
                        <span class="stat-value">$${Math.round(strategy2.ingresos.premium).toLocaleString()}</span>
                    </div>
                </div>
                <div class="strategy-footer">
                    <div class="strategy-total">Total: $${strategy2.total.toLocaleString()}</div>
                </div>
            </div>

            <div class="strategy-card">
                <div class="strategy-header">
                    <div class="strategy-icon">👥</div>
                    <div class="strategy-title">Enfoque Volumen</div>
                </div>
                <div class="strategy-body">
                    <div class="strategy-stat">
                        <i class="fas fa-building"></i>
                        <span>${strategy3.negocios} negocios</span>
                        <span class="stat-value">$${Math.round(strategy3.ingresos.negocios).toLocaleString()}</span>
                    </div>
                    <div class="strategy-stat">
                        <i class="fas fa-user"></i>
                        <span>${strategy3.usuarios} usuarios</span>
                        <span class="stat-value">$${Math.round(strategy3.ingresos.usuarios).toLocaleString()}</span>
                    </div>
                    <div class="strategy-stat">
                        <i class="fas fa-tools"></i>
                        <span>${strategy3.prestadores} prestadores</span>
                        <span class="stat-value">$${Math.round(strategy3.ingresos.prestadores).toLocaleString()}</span>
                    </div>
                    <div class="strategy-stat">
                        <i class="fas fa-crown"></i>
                        <span>${strategy3.premium} premium</span>
                        <span class="stat-value">$${Math.round(strategy3.ingresos.premium).toLocaleString()}</span>
                    </div>
                </div>
                <div class="strategy-footer">
                    <div class="strategy-total">Total: $${strategy3.total.toLocaleString()}</div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Aplicar estrategia de meta a la calculadora
 */
function applyGoalStrategy(negocios, usuarios, porcentajeUsuariosActivos, prestadores, porcentajePrestadoresActivos, premium, coincidencia = 40, skipScroll = false) {
    console.log('Aplicando estrategia de meta');

    if (document.getElementById('negocios-input')) document.getElementById('negocios-input').value = negocios;
    if (document.getElementById('usuarios-input')) document.getElementById('usuarios-input').value = usuarios;
    if (document.getElementById('servicios-usuario-input')) document.getElementById('servicios-usuario-input').value = porcentajeUsuariosActivos;
    if (document.getElementById('prestadores-input')) document.getElementById('prestadores-input').value = prestadores;
    if (document.getElementById('servicios-prestador-input')) document.getElementById('servicios-prestador-input').value = porcentajePrestadoresActivos;
    if (document.getElementById('premium-input')) document.getElementById('premium-input').value = premium;
    if (document.getElementById('coincidencia-input')) document.getElementById('coincidencia-input').value = coincidencia;

    calculateEarnings();

    // Solo hacer scroll si no se solicita saltarlo
    if (!skipScroll) {
        const calculator = document.querySelector('.interactive-controls');
        if (calculator) {
            calculator.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    trackEvent('calculator_goal_strategy_applied', { negocios, usuarios, prestadores, premium, coincidencia });
}

// ==================== MODAL PRÓXIMAMENTE ====================

/**
 * Abre el modal de "Próximamente"
 */
function openComingSoonModal() {
    const modal = document.getElementById('coming-soon-modal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        trackEvent('coming_soon_modal_opened');
    }
}

/**
 * Cierra el modal de "Próximamente"
 */
function closeComingSoonModal() {
    const modal = document.getElementById('coming-soon-modal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Navega al ecosistema y activa un tab específico
 */
function goToEcosystemTab(tabName) {
    // Primero navegar a la sección
    const ecosystemSection = document.getElementById('como-funciona');
    if (ecosystemSection) {
        ecosystemSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Luego activar el tab correcto
    setTimeout(() => {
        showEcosystemTab(tabName);
    }, 300);

    trackEvent('footer_link_click', { tab: tabName });
}

// Inicializar event listeners cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initComingSoonModalListeners);
} else {
    initComingSoonModalListeners();
}

function initComingSoonModalListeners() {
    // Event listener para cerrar modal al hacer clic fuera
    document.addEventListener('click', function(event) {
        const modal = document.getElementById('coming-soon-modal');
        if (modal && event.target === modal) {
            closeComingSoonModal();
        }
    });

    // Event listener para cerrar modal con tecla ESC
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const modal = document.getElementById('coming-soon-modal');
            if (modal && modal.classList.contains('active')) {
                closeComingSoonModal();
            }
        }
    });
}

// Hacer funciones globalmente accesibles
window.applyScenario = applyScenario;
window.calculateGoal = calculateGoal;
window.applyGoalStrategy = applyGoalStrategy;
window.openComingSoonModal = openComingSoonModal;
window.closeComingSoonModal = closeComingSoonModal;
window.goToEcosystemTab = goToEcosystemTab;

// ==================== EXPORTS FOR TESTING ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        performSearch,
        getCurrentLocation,
        showTab,
        showEcosystemTab,
        calculateEarnings,
        applyScenario,
        calculateGoal,
        applyGoalStrategy,
        showDownloadModal,
        showContactModal,
        showAmbassadorModal,
        openModal,
        closeModal,
        trackEvent
    };
}
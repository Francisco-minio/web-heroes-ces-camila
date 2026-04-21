// Configuración segura para Superhéroes App
// Este archivo carga variables de entorno y las expone de forma segura

(function() {
    'use strict';
    
    // Configuración por defecto (desarrollo)
    const defaultConfig = {
        adminUsername: 'profesor',
        adminPassword: 'heroes2024',
        useFirebase: false,
        firebaseConfig: null,
        encryptionKey: null
    };
    
    // Intentar cargar configuración desde variables de entorno (si están disponibles)
    // En producción, estas variables deben configurarse en el hosting
    window.APP_CONFIG = {
        // Credenciales admin - DEBEN cambiarse en producción
        get ADMIN_USERNAME() {
            return window.ENV?.ADMIN_USERNAME || defaultConfig.adminUsername;
        },
        
        get ADMIN_PASSWORD() {
            return window.ENV?.ADMIN_PASSWORD || defaultConfig.adminPassword;
        },
        
        // Configuración Firebase
        get USE_FIREBASE() {
            return window.ENV?.USE_FIREBASE === 'true' || defaultConfig.useFirebase;
        },
        
        get FIREBASE_CONFIG() {
            if (window.ENV?.FIREBASE_API_KEY) {
                return {
                    apiKey: window.ENV.FIREBASE_API_KEY,
                    authDomain: window.ENV.FIREBASE_AUTH_DOMAIN,
                    projectId: window.ENV.FIREBASE_PROJECT_ID,
                    storageBucket: window.ENV.FIREBASE_STORAGE_BUCKET,
                    messagingSenderId: window.ENV.FIREBASE_MESSAGING_SENDER_ID,
                    appId: window.ENV.FIREBASE_APP_ID
                };
            }
            return defaultConfig.firebaseConfig;
        },
        
        // Feature flags de seguridad
        get REQUIRE_HTTPS() {
            return window.ENV?.REQUIRE_HTTPS !== 'false'; // Default: true
        },
        
        get SESSION_TIMEOUT() {
            return parseInt(window.ENV?.SESSION_TIMEOUT) || 3600000; // 1 hora en ms
        },
        
        get ENABLE_ENCRYPTION() {
            return window.ENV?.ENABLE_ENCRYPTION === 'true';
        }
    };
    
    // Validación de seguridad
    window.APP_CONFIG.validate = function() {
        const warnings = [];
        
        if (this.ADMIN_USERNAME === defaultConfig.adminUsername) {
            warnings.push('⚠️ Usando credenciales admin por defecto - CAMBIAR EN PRODUCCIÓN');
        }
        
        if (this.ADMIN_PASSWORD === defaultConfig.adminPassword) {
            warnings.push('⚠️ Usando contraseña admin por defecto - CAMBIAR EN PRODUCCIÓN');
        }
        
        if (!this.USE_FIREBASE) {
            warnings.push('ℹ️ Usando LocalStorage (datos locales) - considerar Firebase para producción');
        }
        
        if (window.location.protocol !== 'https:' && this.REQUIRE_HTTPS && window.location.hostname !== 'localhost') {
            warnings.push('❌ HTTPS requerido en producción');
        }
        
        return warnings;
    };
    
    // Mostrar advertencias en consola
    console.log('Configuración cargada. Advertencias de seguridad:', window.APP_CONFIG.validate());
    
})();

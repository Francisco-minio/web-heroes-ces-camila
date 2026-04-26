// Academia de Superhéroes - JavaScript Principal

// Variables globales
let currentView = 'admin'; // 'admin' o 'student'
let heroes = [];
let pointsHistory = [];
let currentUser = null;
let currentSystemConfig = null;
let selectedHeroes = [];
let availableAvatars = ['🦸', '🦹', '🐉', '⚡', '🌪️', '🛡️', '🧙', '🧚', '🦸‍♀️', '🦹‍♀️', '🔥', '💫', '🌟', '💪', '🧠', '❤️'];
let availableEmojis = ['⭐', '🔥', '💪', '🧠', '❤️', '🌈', '🎯', '🎨', '🌍', '🚀', '🔬', '📚', '🎭', '🏆', '🎪', '🎨'];
let availableMedals = [
    { id: 1, name: 'Medalla de Oro', icon: '🥇', description: 'Excelente rendimiento académico' },
    { id: 2, name: 'Medalla de Plata', icon: '🥈', description: 'Buena participación' },
    { id: 3, name: 'Medalla de Bronce', icon: '🥉', description: 'Esfuerzo constante' },
    { id: 4, name: 'Estrella de Honor', icon: '⭐', description: 'Liderazgo' },
    { id: 5, name: 'Corazón de Héroe', icon: '❤️', description: 'Solidaridad y amistad' },
    { id: 6, name: 'Mente Brillante', icon: '🧠', description: 'Creatividad e innovación' },
    { id: 7, name: 'Fuerza Suprema', icon: '💪', description: 'Perseverancia' },
    { id: 8, name: 'Arcoíris de Talentos', icon: '🌈', description: 'Versatilidad' }
];


let nextMedalId = 9; // Para generar nuevos IDs

// Configuración de API
const API_CONFIG = {
    // Detectar automáticamente si hay backend disponible
    get useBackend() {
        return (window.APP_CONFIG && window.APP_CONFIG.USE_PRISMA === true) || 
               window.location.hostname === 'localhost' ||
               window.location.hostname.includes('vercel.app');
    },
    get baseURL() {
        return (window.APP_CONFIG && window.APP_CONFIG.API_BASE_URL) || './api';
    }
};

// Wrapper para LocalStorage con fallback de memoria (para modo 'file://')
const safeStorage = {
    getItem(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn('LocalStorage no disponible, usando memoria temporal');
            return window._tempStorage?.[key] || null;
        }
    },
    setItem(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            if (!window._tempStorage) window._tempStorage = {};
            window._tempStorage[key] = value;
        }
    },
    removeItem(key) {
        try {
            localStorage.removeItem(key);
        } catch (e) {
            if (window._tempStorage) delete window._tempStorage[key];
        }
    }
};

// Hacer safeStorage disponible globalmente para otros scripts (como medals.js)
window.safeStorage = safeStorage;



// API Layer - Abstracción para Prisma (Vercel) o LocalStorage
const heroAPI = {
    // GET todos los héroes
    async getAll() {
        if (API_CONFIG.useBackend) {
            try {
                const response = await fetch(`${API_CONFIG.baseURL}/heroes`);
                if (!response.ok) throw new Error('API error');
                return await response.json();
            } catch (e) {
                console.log('API no disponible, usando LocalStorage');
                return heroes;
            }
        }
        return heroes;
    },

    // GET un héroe
    async getById(id) {
        if (API_CONFIG.useBackend) {
            const response = await fetch(`${API_CONFIG.baseURL}/heroes/${id}`);
            return await response.json();
        }
        return heroes.find(h => h.id === id);
    },

    // POST crear héroe
    async create(heroData) {
        if (API_CONFIG.useBackend) {
            const response = await fetch(`${API_CONFIG.baseURL}/heroes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(heroData)
            });
            return await response.json();
        }
        // Fallback LocalStorage
        const newHero = {...heroData, id: Date.now() };
        heroes.push(newHero);
        saveToLocalStorage();
        return { id: newHero.id, message: 'Héroe creado' };
    },

    // PUT actualizar héroe
    async update(id, heroData) {
        if (API_CONFIG.useBackend) {
            const response = await fetch(`${API_CONFIG.baseURL}/heroes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(heroData)
            });
            return await response.json();
        }
        // Fallback LocalStorage
        const index = heroes.findIndex(h => h.id === id);
        if (index !== -1) {
            heroes[index] = {...heroes[index], ...heroData };
            saveToLocalStorage();
        }
        return { success: true };
    },

    // DELETE eliminar héroe
    async delete(id) {
        if (API_CONFIG.useBackend) {
            const response = await fetch(`${API_CONFIG.baseURL}/heroes/${id}`, {
                method: 'DELETE'
            });
            return await response.json();
        }
        // Fallback LocalStorage
        heroes = heroes.filter(h => h.id !== id);
        saveToLocalStorage();
        return { success: true };
    },

    // POST asignar puntos
    async assignPoints(id, points, reason) {
        if (API_CONFIG.useBackend) {
            const response = await fetch(`${API_CONFIG.baseURL}/heroes/${id}/points`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ points, reason })
            });
            return await response.json();
        }
        // Fallback LocalStorage
        const hero = heroes.find(h => h.id === id);
        if (hero) {
            hero.points += points;
            saveToLocalStorage();
        }
        return { success: true, points_added: points };
    }
};

// Credenciales de autenticación
// Usar credenciales desde configuración segura con fallback
const ADMIN_CREDENTIALS = {
    get username() { return (window.APP_CONFIG && window.APP_CONFIG.ADMIN_USERNAME) || 'profesor'; },
    get password() { return (window.APP_CONFIG && window.APP_CONFIG.ADMIN_PASSWORD) || 'heroes2024'; }
};


let isAuthenticated = false;

// Inicialización
document.addEventListener('DOMContentLoaded', async function() {
    loadFromLocalStorage();
    await syncWithBackend();
    checkAuthentication();
    initializeApp();
    updateStats();
    populateHeroesTable();
    populatePointsHistory();
    populateAvatarSelection();
    populateEmojiSelector();
    populateCourseDropdowns(); // <-- Añadido
    setupEventListeners();
});

// Sincronizar datos con el backend si está disponible
async function syncWithBackend() {
    if (API_CONFIG.useBackend) {
        try {
            console.log('Sincronizando con el backend...');
            const backendHeroes = await heroAPI.getAll();
            if (backendHeroes && Array.isArray(backendHeroes)) {
                // Normalizar datos (Prisma usa courseCode, el frontend espera course)
                heroes = backendHeroes.map(h => ({
                    ...h,
                    course: h.courseCode || h.course
                }));
                
                saveToLocalStorage(); // Guardar copia local por si acaso
                console.log('Sincronización exitosa. Héroes cargados:', heroes.length);
            }
        } catch (e) {
            console.error('Error al sincronizar con el backend:', e);
        }
    }
}

// Verificar autenticación al cargar
function checkAuthentication() {
    const authStatus = safeStorage.getItem('isAuthenticated');
    const heroId = safeStorage.getItem('currentHeroId');

    console.log('checkAuthentication - heroId:', heroId, 'heroes count:', heroes.length);

    if (authStatus === 'true') {
        isAuthenticated = true;
        showAdminDashboard();
    } else if (heroId) {
        // Verificar si el héroe existe - comparar tanto string como número
        const hero = heroes.find(h => h.id === parseInt(heroId) || h.id === heroId);
        console.log('Buscando héroe con ID:', heroId, 'Hero encontrado:', hero);
        if (hero) {
            currentUser = hero;
            showStudentView();
        } else {
            safeStorage.removeItem('currentHeroId');
            showAuthModal();
        }
    } else {
        showAuthModal();
    }
}


// Mostrar modal de autenticación
function showAuthModal() {
    const authModal = new bootstrap.Modal(document.getElementById('authModal'));
    authModal.show();
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('studentView').style.display = 'none';
}

// Autenticar usuario
function authenticate() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        isAuthenticated = true;
        safeStorage.setItem('isAuthenticated', 'true');


        const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
        authModal.hide();

        showAdminDashboard();
        showSuccessAnimation('¡Bienvenido Profesor!');

        // Limpiar formulario
        document.getElementById('authForm').reset();
    } else {
        showErrorAnimation('Credenciales incorrectas. Intenta nuevamente.');
        document.getElementById('password').value = '';
        document.getElementById('password').focus();
    }
}

// Mostrar login de héroe
function showHeroLogin() {
    const authModal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
    authModal.hide();

    const heroLoginModal = new bootstrap.Modal(document.getElementById('heroLoginModal'));
    heroLoginModal.show();
}

// Mostrar login de profesor
function showTeacherLogin() {
    const heroLoginModal = bootstrap.Modal.getInstance(document.getElementById('heroLoginModal'));
    heroLoginModal.hide();

    const authModal = new bootstrap.Modal(document.getElementById('authModal'));
    authModal.show();
}

// Autenticar héroe
function authenticateHero() {
    const username = document.getElementById('heroUsername').value;
    const password = document.getElementById('heroPassword').value;

    const hero = heroes.find(h => h.username === username && h.password === password);

    if (hero) {
        currentUser = hero;
        safeStorage.setItem('currentHeroId', hero.id);


        const heroLoginModal = bootstrap.Modal.getInstance(document.getElementById('heroLoginModal'));
        heroLoginModal.hide();

        showStudentView();
        showSuccessAnimation(`¡Bienvenido ${hero.heroName}!`);

        // Limpiar formulario
        document.getElementById('heroLoginForm').reset();
    } else {
        showErrorAnimation('Usuario o contraseña incorrectos. Intenta nuevamente.');
        document.getElementById('heroPassword').value = '';
        document.getElementById('heroPassword').focus();
    }
}

// Mostrar vista de estudiante
function showStudentView() {
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('studentView').style.display = 'block';
    document.getElementById('toggleViewBtn').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'inline-block';
    document.getElementById('currentUser').textContent = currentUser ? currentUser.heroName : 'Estudiante';
    currentView = 'student';
    updateStudentView();
}

// Cerrar sesión
function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        isAuthenticated = false;
        safeStorage.setItem('isAuthenticated', 'false');
        safeStorage.removeItem('currentHeroId');
        currentUser = null;


        document.getElementById('toggleViewBtn').style.display = 'none';
        document.getElementById('logoutBtn').style.display = 'none';

        showAuthModal();
        showSuccessAnimation('Sesión cerrada correctamente');
    }
}

// Mostrar dashboard de administración
function showAdminDashboard() {
    document.getElementById('adminDashboard').style.display = 'block';
    document.getElementById('studentView').style.display = 'none';
    document.getElementById('toggleViewBtn').style.display = 'inline-block';
    document.getElementById('logoutBtn').style.display = 'inline-block';
    document.getElementById('currentUser').textContent = 'Profesor';
    currentView = 'admin';
    showSection('stats'); // Mostrar estadísticas por defecto
}

// Mostrar animación de error
function showErrorAnimation(message) {
    const div = document.createElement('div');
    div.className = 'alert alert-danger position-fixed top-0 start-50 translate-middle-x mt-3';
    div.style.zIndex = '9999';
    div.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    document.body.appendChild(div);

    setTimeout(() => {
        div.remove();
    }, 3000);
}

// Configurar event listeners
function setupEventListeners() {
    // Búsqueda de héroes
    document.getElementById('searchHero').addEventListener('input', filterHeroes);
    document.getElementById('filterCourse').addEventListener('change', filterHeroes);
    document.getElementById('filterPoints').addEventListener('change', filterHeroes);

    // Formulario de nuevo héroe
    document.getElementById('heroForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveHero();
    });

    // Limpiar formulario al cerrar modal
    document.getElementById('heroModal').addEventListener('hidden.bs.modal', function() {
        resetHeroForm();
    });

    // Formulario de autenticación
    document.getElementById('authForm').addEventListener('submit', function(e) {
        e.preventDefault();
        authenticate();
    });

    // Enter key en campos de autenticación
    document.getElementById('username').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('password').focus();
        }
    });

    document.getElementById('password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            authenticate();
        }
    });

    // Filtros de cursos
    const courseSearch = document.getElementById('courseSearch');
    if (courseSearch) courseSearch.addEventListener('input', refreshCourseView);
    
    const courseLevelFilter = document.getElementById('courseLevelFilter');
    if (courseLevelFilter) courseLevelFilter.addEventListener('change', refreshCourseView);
}

// Inicializar aplicación
function initializeApp() {
    // Si no hay datos, crear datos de ejemplo
    if (heroes.length === 0) {
        createSampleData();
    }

    // Solo establecer usuario simulado si NO hay sesión activa
    // (para no sobreescribir la sesión restaurada de localStorage)
    if (!currentUser && !safeStorage.getItem('currentHeroId')) {

        currentUser = heroes[0] || null;
        if (currentUser) {
            updateStudentView();
        }
    }
}

// Crear datos de ejemplo
function createSampleData() {
    heroes = [{
            id: 1,
            realName: 'Ana García',
            heroName: 'Thunder Girl',
            course: '1A',
            specialPower: 'Rayos de conocimiento matemático',
            avatar: '⚡',
            points: 120,
            streak: 5,
            emojis: ['⭐', '🧠'],
            medals: [
                { id: 1, name: 'Medalla de Oro', icon: '🥇', description: 'Excelente rendimiento académico', date: new Date('2024-01-15') },
                { id: 4, name: 'Estrella de Honor', icon: '⭐', description: 'Liderazgo', date: new Date('2024-01-10') }
            ],
            missions: [
                { icon: '📚', description: 'Completar tarea de matemáticas', points: 20, date: new Date('2024-01-15') },
                { icon: '🤝', description: 'Ayudar a compañero', points: 15, date: new Date('2024-01-14') }
            ]
        },
        {
            id: 2,
            realName: 'Carlos López',
            heroName: 'Fire Boy',
            course: '1B',
            specialPower: 'Fuerza de la lectura',
            avatar: '🔥',
            points: 95,
            streak: 3,
            emojis: ['🔥', '💪'],
            medals: [
                { id: 2, name: 'Medalla de Plata', icon: '🥈', description: 'Buena participación', date: new Date('2024-01-12') }
            ],
            missions: [
                { icon: '🎨', description: 'Excelente dibujo', points: 10, date: new Date('2024-01-15') }
            ]
        },
        {
            id: 3,
            realName: 'María Rodríguez',
            heroName: 'Star Princess',
            course: '2A',
            specialPower: 'Creatividad infinita',
            avatar: '🌟',
            points: 150,
            streak: 7,
            emojis: ['⭐', '🌈'],
            medals: [
                { id: 1, name: 'Medalla de Oro', icon: '🥇', description: 'Excelente rendimiento académico', date: new Date('2024-01-15') },
                { id: 6, name: 'Mente Brillante', icon: '🧠', description: 'Creatividad e innovación', date: new Date('2024-01-13') },
                { id: 8, name: 'Arcoíris de Talentos', icon: '🌈', description: 'Versatilidad', date: new Date('2024-01-08') }
            ],
            missions: [
                { icon: '🎭', description: 'Mejor presentación oral', points: 25, date: new Date('2024-01-15') },
                { icon: '📝', description: 'Redacción perfecta', points: 20, date: new Date('2024-01-14') }
            ]
        }
    ];

    saveToLocalStorage();
}

// Cambiar entre vistas
function toggleView() {
    if (!isAuthenticated) {
        showAuthModal();
        return;
    }

    const adminView = document.getElementById('adminDashboard');
    const studentView = document.getElementById('studentView');
    const currentUserSpan = document.getElementById('currentUser');

    if (currentView === 'admin') {
        adminView.style.display = 'none';
        studentView.style.display = 'block';
        currentUserSpan.textContent = currentUser ? currentUser.heroName : 'Estudiante';
        currentView = 'student';
        updateStudentView();
    } else {
        adminView.style.display = 'block';
        studentView.style.display = 'none';
        currentUserSpan.textContent = 'Profesor';
        currentView = 'admin';
    }
}

// Mostrar sección específica del dashboard con animación
function showSection(section) {
    // Ocultar todas las secciones con transición
    const sections = ['statsSection', 'heroesSection', 'coursesSection', 'pointsSection', 'medalsSection'];
    sections.forEach(s => {
        const el = document.getElementById(s);
        if (el) {
            el.style.display = 'none';
            el.classList.remove('animate__animated', 'animate__fadeInUp');
        }
    });

    const targetEl = document.getElementById(`${section}Section`);
    if (targetEl) {
        targetEl.style.display = 'block';
        // Añadir clase de animación (usando CSS transition o simple timeout para reflow)
        setTimeout(() => {
            targetEl.style.opacity = '1';
            targetEl.style.transform = 'translateY(0)';
        }, 10);
    }

    // Poblar datos específicos
    switch (section) {
        case 'heroes':
            populateHeroesTable();
            break;
        case 'courses':
            refreshCourseView();
            break;
        case 'points':
            populateHeroesCheckboxes();
            populatePointsHistory();
            break;
        case 'medals':
            populateMedalsSection();
            break;
        case 'cron':
            populateCronLogs();
            break;
        case 'quickRayos':
            populateQuickRayos();
            break;
        case 'stats':
            updateStats();
            break;
    }
}

// Actualizar estadísticas
function updateStats() {
    const totalHeroesEl = document.getElementById('totalHeroes');
    if (!totalHeroesEl) return;

    totalHeroesEl.textContent = heroes.length;
    document.getElementById('totalPoints').textContent = heroes.reduce((sum, hero) => sum + hero.points, 0);
    document.getElementById('activeMissions').textContent = heroes.reduce((sum, hero) => sum + (hero.missions ? hero.missions.length : 0), 0);

    const sortedHeroes = [...heroes].sort((a, b) => b.points - a.points);
    const topHeroElement = document.getElementById('topHeroes');
    
    if (topHeroElement) {
        if (sortedHeroes.length > 0) {
            topHeroElement.textContent = sortedHeroes[0].heroName;
        } else {
            topHeroElement.textContent = '-';
        }
    }
}

// Poblar tabla de héroes
function populateHeroesTable() {
    const tbody = document.getElementById('heroesTableBody');
    tbody.innerHTML = '';

    heroes.forEach(hero => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span style="font-size: 2rem;">${hero.avatar}</span></td>
            <td>${hero.realName}</td>
            <td><strong>${hero.heroName}</strong></td>
            <td>${hero.course}</td>
            <td>${hero.specialPower}</td>
            <td><span class="badge bg-warning text-dark">${hero.points}</span></td>
            <td>
                <small><strong>Usuario:</strong> ${hero.username || 'N/A'}</small><br>
                <small><strong>Clave:</strong> ${hero.password || 'N/A'}</small>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editHero(${hero.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteHero(${hero.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Poblar checkboxes para asignación de puntos
function populateHeroesCheckboxes() {
    const container = document.getElementById('heroesCheckboxes');
    container.innerHTML = '';

    heroes.forEach(hero => {
        const checkbox = document.createElement('div');
        checkbox.className = 'form-check';
        checkbox.innerHTML = `
            <input class="form-check-input" type="checkbox" value="${hero.id}" id="hero${hero.id}">
            <label class="form-check-label" for="hero${hero.id}">
                <span style="font-size: 1.5rem;">${hero.avatar}</span> ${hero.heroName} (${hero.realName})
            </label>
        `;
        container.appendChild(checkbox);
    });
}

// Poblar historial de puntos
function populatePointsHistory() {
    const tbody = document.getElementById('pointsHistoryBody');
    tbody.innerHTML = '';

    pointsHistory.slice(-10).reverse().forEach(entry => {
        const row = document.createElement('tr');
        const heroNames = entry.heroIds.map(id => {
            const hero = heroes.find(h => h.id === id);
            return hero ? hero.heroName : 'Desconocido';
        }).join(', ');

        row.innerHTML = `
            <td>${new Date(entry.date).toLocaleDateString()}</td>
            <td>${heroNames}</td>
            <td>${entry.reason}</td>
            <td><span class="badge bg-success">+${entry.points}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Poblar selección de avatares
function populateAvatarSelection() {
    const container = document.getElementById('avatarSelection');
    container.innerHTML = '';

    availableAvatars.forEach(avatar => {
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'avatar-option';
        avatarDiv.innerHTML = avatar;
        avatarDiv.onclick = function() {
            document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
            this.classList.add('selected');
        };
        container.appendChild(avatarDiv);
    });
}

// Poblar selector de emojis
function populateEmojiSelector() {
    const container = document.getElementById('emojiSelector');
    container.innerHTML = '';

    availableEmojis.forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = 'emoji-btn';
        btn.innerHTML = emoji;
        btn.onclick = function() {
            this.classList.toggle('selected');
            updateStudentEmojis();
        };
        container.appendChild(btn);
    });
}

// Poblar biblioteca de iconos
function populateIconsLibrary() {
    const container = document.getElementById('iconsLibrary');
    container.innerHTML = '';

    [...availableAvatars, ...availableEmojis].forEach(icon => {
        const iconCard = document.createElement('div');
        iconCard.className = 'col-md-2 col-sm-3 col-4 mb-3';
        iconCard.innerHTML = `
            <div class="card text-center p-3">
            </div>
        `;

        medalCard.querySelector('.medal-option').onclick = function() {
            document.querySelectorAll('.medal-option').forEach(el => {
                el.style.borderColor = 'transparent';
            });
            this.style.borderColor = '#FFD700';
        };

        medalSelection.appendChild(medalCard);
    });

    // Poblar historial de medallas entregadas
    populateMedalsHistory();
}

// Guardar héroe (nuevo o actualizado)
async function saveHero() {
    const realName = document.getElementById('realName').value;
    const heroName = document.getElementById('heroName').value;
    const course = document.getElementById('course').value;
    const specialPower = document.getElementById('specialPower').value;
    const heroUsername = document.getElementById('newHeroUsername').value.trim();
    const heroPassword = document.getElementById('newHeroPassword').value;
    const selectedAvatar = document.querySelector('.avatar-option.selected');

    if (!realName || !heroName || !course) {
        alert('Por favor completa todos los campos requeridos');
        return;
    }

    // Verificar si estamos editando o creando
    const isEditing = window.editingHeroId !== undefined;

    // Solo requerir username/password para nuevos héroes o si se están proporcionando
    if (!isEditing && (!heroUsername || !heroPassword)) {
        alert('Por favor ingresa el nombre de usuario y contraseña para el login del alumno');
        return;
    }

    // Obtener datos actuales si estamos editando
    const existingHero = isEditing ? heroes.find(h => h.id === window.editingHeroId) : null;

    const heroData = {
        realName,
        heroName,
        course,
        specialPower,
        username: heroUsername || (existingHero ? existingHero.username : undefined),
        password: heroPassword || (existingHero ? existingHero.password : undefined),
        avatar: selectedAvatar ? selectedAvatar.innerHTML : (existingHero ? existingHero.avatar : '🦸'),
        medals: existingHero ? existingHero.medals : [],
        emojis: existingHero ? existingHero.emojis : [],
        points: existingHero ? existingHero.points : 0,
        streak: existingHero ? existingHero.streak : 0
    };

    try {
        if (isEditing) {
            await heroAPI.update(window.editingHeroId, heroData);
            showSuccessAnimation('¡Héroe actualizado exitosamente!');
        } else {
            const result = await heroAPI.create(heroData);
            showSuccessAnimation(`¡Nuevo héroe agregado! <br>Usuario: ${heroUsername} <br>Contraseña: ${heroPassword}`);
        }

        // Refrescar datos desde el servidor
        await syncWithBackend();
        populateHeroesTable();
        updateStats();

        // Cerrar modal y limpiar formulario
        const modal = bootstrap.Modal.getInstance(document.getElementById('heroModal'));
        modal.hide();
        resetHeroForm();
    } catch (e) {
        console.error('Error al guardar:', e);
        showErrorAnimation('No se pudo guardar en el servidor. Revisa la conexión.');
    }
}

// Resetear formulario de héroe
function resetHeroForm() {
    document.getElementById('heroForm').reset();
    document.getElementById('newHeroUsername').value = '';
    document.getElementById('newHeroPassword').value = '';
    document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
    window.editingHeroId = undefined;

    // Restaurar título y botón del modal
    document.querySelector('#heroModal .modal-title').innerHTML = '<i class="fas fa-plus"></i> Nuevo Superhéroe';
    document.querySelector('#heroModal .modal-footer .btn-primary').innerHTML = '<i class="fas fa-save"></i> Guardar Héroe';
}

// Editar héroe
function editHero(id) {
    const hero = heroes.find(h => h.id === id);
    if (!hero) return;

    // Guardar el ID del héroe que se está editando
    window.editingHeroId = id;

    // Llenar formulario con datos del héroe
    document.getElementById('realName').value = hero.realName;
    document.getElementById('heroName').value = hero.heroName;
    document.getElementById('course').value = hero.course;
    document.getElementById('specialPower').value = hero.specialPower;
    document.getElementById('newHeroUsername').value = hero.username || '';
    document.getElementById('newHeroPassword').value = hero.password || '';

    // Seleccionar avatar
    document.querySelectorAll('.avatar-option').forEach(el => {
        el.classList.remove('selected');
        if (el.innerHTML === hero.avatar) {
            el.classList.add('selected');
        }
    });

    // Cambiar título del modal
    document.querySelector('#heroModal .modal-title').innerHTML = '<i class="fas fa-edit"></i> Editar Superhéroe';

    // Cambiar texto del botón
    document.querySelector('#heroModal .modal-footer .btn-primary').innerHTML = '<i class="fas fa-save"></i> Actualizar Héroe';

    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('heroModal'));
    modal.show();
}

// ...
// Eliminar héroe
async function deleteHero(id) {
    if (confirm('¿Estás seguro de que quieres eliminar a este héroe?')) {
        try {
            await heroAPI.delete(id);
            await syncWithBackend();
            populateHeroesTable();
            updateStats();
            showSuccessAnimation('Héroe eliminado');
        } catch (e) {
            showErrorAnimation('Error al eliminar');
        }
    }
}

// Asignar puntos
async function assignPoints() {
    const checkboxes = document.querySelectorAll('#heroesCheckboxes input:checked');
    const reason = document.getElementById('pointsReason').value;
    const points = parseInt(document.getElementById('pointsAmount').value);

    if (checkboxes.length === 0) {
        alert('Por favor selecciona al menos un héroe');
        return;
    }

    if (!reason) {
        alert('Por favor ingresa el motivo de la asignación');
        return;
    }

    const heroIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

    try {
        // Enviar al servidor para cada héroe
        const promises = heroIds.map(id => heroAPI.assignPoints(id, points, reason));
        await Promise.all(promises);

        // Refrescar datos desde el servidor
        await syncWithBackend();
        
        // Agregar al historial local
        pointsHistory.push({
            heroIds,
            reason,
            points,
            date: new Date()
        });

        saveToLocalStorage();
        updateStats();
        populateHeroesTable();
        populatePointsHistory();

        // Limpiar formulario
        document.getElementById('pointsReason').value = '';
        document.querySelectorAll('#heroesCheckboxes input').forEach(cb => cb.checked = false);

        // Mostrar animación
        if (typeof showPointsAnimation === 'function') showPointsAnimation(points);
        showSuccessAnimation(`¡${points} rayos (⚡) actualizados!`);
    } catch (e) {
        console.error('Error al actualizar rayos:', e);
        showErrorAnimation('Error al actualizar rayos en el servidor');
    }
}

// Actualizar vista del estudiante
function updateStudentView() {
    if (!currentUser) {
        console.error('No hay currentUser en updateStudentView');
        return;
    }

    // Asegurar que todos los campos estén inicializados
    if (!currentUser.emojis) currentUser.emojis = [];
    if (!currentUser.specialPower) currentUser.specialPower = '';
    if (!currentUser.avatar) currentUser.avatar = '🦸';

    document.getElementById('studentAvatar').innerHTML = currentUser.avatar;
    document.getElementById('studentHeroName').textContent = currentUser.heroName;
    document.getElementById('studentPoints').textContent = currentUser.points || 0;
    document.getElementById('studentStreak').textContent = currentUser.streak || 0;
    document.getElementById('studentPower').value = currentUser.specialPower;

    console.log('updateStudentView - currentUser:', currentUser.heroName, 'Power:', currentUser.specialPower, 'Emojis:', currentUser.emojis);

    // Actualizar misiones (historial de puntos)
    updateMissionsHistory();

    // Actualizar rankings
    updateRankings();

    // Actualizar medallas
    updateMedals();

    // Actualizar selector de emojis
    updateEmojiSelector();

    // Actualizar tienda de recompensas
}

// Actualizar selector de emojis del estudiante
function updateEmojiSelector() {
    if (!currentUser) {
        console.error('No hay usuario actual para mostrar emojis');
        return;
    }

    const container = document.getElementById('emojiSelector');
    if (!container) {
        console.error('No se encontró el contenedor emojiSelector');
        return;
    }

    container.innerHTML = '';

    availableEmojis.forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = 'emoji-btn';
        btn.innerHTML = emoji;
        btn.type = 'button';

        // Marcar emojis seleccionados
        if (currentUser.emojis && currentUser.emojis.includes(emoji)) {
            btn.classList.add('selected');
        }

        // Crear botón con onclick inline para mayor confiabilidad
        // Escapar comillas simples en el emoji para evitar romper el onclick
        const safeEmoji = emoji.replace(/'/g, "\\'");
        btn.setAttribute('onclick', `toggleEmoji(this, '${safeEmoji}')`);

        container.appendChild(btn);
    });

    console.log('Emojis cargados:', availableEmojis.length);
}

// Función para togglear emoji - llamada desde onclick inline
function toggleEmoji(btn, emoji) {
    console.log('toggleEmoji llamado:', emoji);
    btn.classList.toggle('selected');

    // Obtener todos los emojis seleccionados
    const selectedEmojis = Array.from(document.querySelectorAll('.emoji-btn.selected'))
        .map(b => b.innerHTML);

    // Actualizar currentUser
    if (currentUser) {
        currentUser.emojis = selectedEmojis;

        // Actualizar también en el array de héroes
        const heroIndex = heroes.findIndex(h => h.id === currentUser.id);
        if (heroIndex !== -1) {
            heroes[heroIndex].emojis = selectedEmojis;
        }

        saveToLocalStorage();
        showSuccessAnimation('¡Emojis actualizados!');
        console.log('Emojis guardados:', selectedEmojis);
    }
}

// Actualizar historial de misiones (puntos recibidos)
function updateMissionsHistory() {
    if (!currentUser) return;

    const container = document.getElementById('missionsHistory');
    container.innerHTML = '';

    // Obtener todas las asignaciones de puntos para este héroe
    const heroPointsHistory = pointsHistory.filter(entry =>
        entry.heroIds.includes(currentUser.id)
    );

    // Combinar con misiones existentes
    const allActivities = [];

    // Agregar misiones personalizadas
    if (currentUser.missions) {
        currentUser.missions.forEach(mission => {
            allActivities.push({
                type: 'mission',
                icon: mission.icon,
                description: mission.description,
                points: mission.points,
                date: mission.date
            });
        });
    }

    // Agregar asignaciones de puntos
    heroPointsHistory.forEach(entry => {
        allActivities.push({
            type: 'points',
            icon: '⭐',
            description: entry.reason,
            points: entry.points,
            date: entry.date
        });
    });

    // Ordenar por fecha (más reciente primero)
    allActivities.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Mostrar últimas 10 actividades
    allActivities.slice(0, 10).forEach(activity => {
        const missionCard = document.createElement('div');
        missionCard.className = 'col-md-6 mb-3';
        missionCard.innerHTML = `
            <div class="card mission-card h-100 border-0 shadow-sm">
                <div class="card-body d-flex align-items-center">
                    <div class="mission-icon me-3 h2 mb-0">${activity.icon}</div>
                    <div class="flex-grow-1">
                        <h6 class="mb-1 fw-bold">${activity.description}</h6>
                        <small class="text-muted">${new Date(activity.date).toLocaleDateString()}</small>
                    </div>
                    <div class="ms-3">
                        <span class="badge bg-success py-2">+${activity.points}</span>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(missionCard);
    });

    if (allActivities.length === 0) {
        container.innerHTML = '<p class="text-muted">Aún no tienes actividades registradas</p>';
    }
}

// Actualizar rankings
function updateRankings(specificPeriod) {
    const periods = specificPeriod ? [specificPeriod] : ['daily', 'weekly', 'monthly', 'general'];
    const now = new Date();
    
    periods.forEach(period => {
        const container = document.getElementById(`${period}RankingList`);
        if (!container) return;

        container.innerHTML = '';

        // Calcular puntos para el periodo
        const heroesWithPeriodPoints = heroes.map(hero => {
            let periodPoints = 0;
            const history = hero.pointsHistory || [];
            
            if (period === 'general') {
                periodPoints = hero.points;
            } else {
                const startDate = new Date();
                if (period === 'daily') startDate.setHours(0, 0, 0, 0);
                if (period === 'weekly') {
                    const day = startDate.getDay();
                    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
                    startDate.setDate(diff);
                    startDate.setHours(0, 0, 0, 0);
                }
                if (period === 'monthly') {
                    startDate.setDate(1);
                    startDate.setHours(0, 0, 0, 0);
                }

                periodPoints = history
                    .filter(h => new Date(h.date) >= startDate)
                    .reduce((sum, h) => sum + h.points, 0);
            }

            return { ...hero, periodPoints };
        });

        // Ordenar por puntos del periodo
        const rankedHeroes = heroesWithPeriodPoints
            .sort((a, b) => b.periodPoints - a.periodPoints)
            .slice(0, 10);

        if (rankedHeroes.length === 0) {
            container.innerHTML = '<p class="text-center text-muted p-3">Sin actividad en este periodo</p>';
            return;
        }

        rankedHeroes.forEach((hero, index) => {
            const rankingItem = document.createElement('div');
            rankingItem.className = 'ranking-item';
            if (currentUser && hero.id === currentUser.id) {
                rankingItem.classList.add('current-user-ranking');
            }

            const positionClass = index === 0 ? 'position-1' :
                index === 1 ? 'position-2' :
                index === 2 ? 'position-3' : 'position-default';

            rankingItem.innerHTML = `
                <div class="ranking-position ${positionClass}">${index + 1}</div>
                <div class="ranking-avatar h2 mb-0 me-3">${hero.avatar}</div>
                <div class="flex-grow-1">
                    <div class="fw-bold mb-0">${hero.heroName}</div>
                    <div class="small text-muted"><i class="fas fa-bolt text-warning"></i> ${hero.course || 'Héroe'}</div>
                </div>
                <div class="text-end">
                    <div class="badge bg-warning">${hero.periodPoints} ⚡</div>
                </div>
            `;
            container.appendChild(rankingItem);
        });
    });
}

// Actualizar medallas
function updateMedals() {
    if (!currentUser) {
        console.error('updateMedals: No hay currentUser');
        return;
    }

    const container = document.getElementById('medalsDisplay');
    if (!container) {
        console.error('updateMedals: No se encontró medalsDisplay');
        return;
    }

    container.innerHTML = '';

    const allMedals = [];

    // 1. Medallas automáticas basadas en rayos
    if (currentUser.points >= 50) allMedals.push({
        icon: '🥉',
        name: 'Bronce',
        description: '¡Has alcanzado 50 rayos! Tu esfuerzo comienza a dar frutos.',
        requirement: '50 rayos (⚡)',
        type: 'auto'
    });
    if (currentUser.points >= 100) allMedals.push({
        icon: '🥈',
        name: 'Plata',
        description: '¡Increíble! 100 rayos demuestran tu constancia.',
        requirement: '100 rayos (⚡)',
        type: 'auto'
    });
    if (currentUser.points >= 200) allMedals.push({
        icon: '🥇',
        name: 'Oro',
        description: '¡Excelencia pura! 200 rayos te convierten en una leyenda.',
        requirement: '200 rayos (⚡)',
        type: 'auto'
    });
    if (currentUser.streak >= 7) allMedals.push({
        icon: '🔥',
        name: 'Racha',
        description: '¡7 días consecutivos de trabajo! Tu disciplina es admirable.',
        requirement: '7 días seguidos',
        type: 'auto'
    });

    // 2. Medallas personalizadas asignadas por el profesor
    console.log('updateMedals - currentUser.medals:', currentUser.medals);
    if (currentUser.medals && currentUser.medals.length > 0) {
        currentUser.medals.forEach(medal => {
            allMedals.push({
                icon: medal.icon,
                name: medal.name,
                description: medal.description,
                requirement: 'Medalla especial del profesor',
                type: 'custom'
            });
        });
    }

    // Mostrar todas las medallas
    console.log('updateMedals - Total medallas a mostrar:', allMedals.length);
    allMedals.forEach((medal, index) => {
        const medalDiv = document.createElement('div');
        medalDiv.className = 'medal medal-clickable';
        medalDiv.setAttribute('onclick', `showMedalInfo(${index})`);
        medalDiv.innerHTML = medal.icon;
        medalDiv.dataset.name = medal.name;
        medalDiv.dataset.description = medal.description;
        medalDiv.dataset.requirement = medal.requirement;
        container.appendChild(medalDiv);
    });

    if (allMedals.length === 0) {
        container.innerHTML = '<p class="text-muted">Sigue esforzándote para ganar medallas</p>';
    }
}

function showMedalInfo(index) {
    const medal = allMedals[index];
    const name = medal.name;
    const description = medal.description;
    const requirement = medal.requirement;

    // Crear modal dinámicamente si no existe
    let modalEl = document.getElementById('medalInfoModal');
    if (!modalEl) {
        modalEl = document.createElement('div');
        modalEl.id = 'medalInfoModal';
        modalEl.className = 'modal fade';
        modalEl.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content medal-modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="medalInfoTitle"></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body text-center">
                        <div id="medalInfoIcon" style="font-size: 4rem;"></div>
                        <p id="medalInfoDescription" class="mt-3"></p>
                        <div class="badge bg-primary mt-2">Requisito: <span id="medalInfoRequirement"></span></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modalEl);
    }

    document.getElementById('medalInfoTitle').textContent = name;
    document.getElementById('medalInfoIcon').textContent = medal.innerHTML;
    document.getElementById('medalInfoDescription').textContent = description;
    document.getElementById('medalInfoRequirement').textContent = requirement;

    const modal = new bootstrap.Modal(modalEl);
    modal.show();
}

// Actualizar emojis del estudiante
function updateStudentEmojis() {
    if (!currentUser) return;

    const selectedEmojis = Array.from(document.querySelectorAll('.emoji-btn.selected'))
        .map(btn => btn.innerHTML);

    currentUser.emojis = selectedEmojis;
    saveToLocalStorage();
}

// Actualizar poder especial del estudiante
function updateStudentPower() {
    if (!currentUser) {
        console.error('No hay usuario actual');
        return;
    }

    const powerInput = document.getElementById('studentPower');
    if (!powerInput) {
        console.error('No se encontró el campo studentPower');
        return;
    }

    const newPower = powerInput.value.trim();

    if (newPower && newPower !== currentUser.specialPower) {
        currentUser.specialPower = newPower;

        // Actualizar también en el array de héroes
        const heroIndex = heroes.findIndex(h => h.id === currentUser.id);
        if (heroIndex !== -1) {
            heroes[heroIndex].specialPower = newPower;
        }

        saveToLocalStorage();
        showSuccessAnimation('¡Poder especial actualizado!');
        console.log('Poder especial guardado:', newPower);
    }
}

// Cambiar avatar del estudiante
function changeAvatar() {
    if (!currentUser) {
        console.error('No hay usuario actual para cambiar avatar');
        return;
    }

    const currentIndex = availableAvatars.indexOf(currentUser.avatar);
    const nextIndex = (currentIndex + 1) % availableAvatars.length;
    currentUser.avatar = availableAvatars[nextIndex];

    // Actualizar también en el array de héroes
    const heroIndex = heroes.findIndex(h => h.id === currentUser.id);
    if (heroIndex !== -1) {
        heroes[heroIndex].avatar = availableAvatars[nextIndex];
    }

    saveToLocalStorage();
    updateStudentView();
    showSuccessAnimation('¡Avatar cambiado!');
    console.log('Avatar cambiado a:', currentUser.avatar);
}

// Filtrar héroes
function filterHeroes() {
    const searchTerm = document.getElementById('searchHero').value.toLowerCase();
    const courseFilter = document.getElementById('filterCourse').value;
    const pointsFilter = document.getElementById('filterPoints').value;

    let filtered = heroes;

    if (searchTerm) {
        filtered = filtered.filter(hero =>
            hero.realName.toLowerCase().includes(searchTerm) ||
            hero.heroName.toLowerCase().includes(searchTerm)
        );
    }

    if (courseFilter) {
        filtered = filtered.filter(hero => hero.course === courseFilter);
    }

    if (pointsFilter) {
        const [min, max] = pointsFilter.split('-').map(p => p.replace('+', ''));
        filtered = filtered.filter(hero => {
            if (max) {
                return hero.points >= parseInt(min) && hero.points <= parseInt(max);
            } else {
                return hero.points >= parseInt(min);
            }
        });
    }

    // Actualizar tabla con resultados filtrados
    const tbody = document.getElementById('heroesTableBody');
    tbody.innerHTML = '';

    filtered.forEach(hero => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span style="font-size: 2rem;">${hero.avatar}</span></td>
            <td>${hero.realName}</td>
            <td><strong>${hero.heroName}</strong></td>
            <td>${hero.course}</td>
            <td>${hero.specialPower}</td>
            <td><span class="badge bg-warning text-dark">${hero.points}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="editHero(${hero.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteHero(${hero.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Agregar nuevo icono
function addNewIcon() {
    const newIcon = prompt('Ingresa el nuevo icono (emoji):');
    if (newIcon) {
        availableEmojis.push(newIcon);
        populateIconsLibrary();
        populateEmojiSelector();
        showSuccessAnimation('¡Nuevo icono agregado!');
    }
}

// Animaciones Premium
function showSuccessAnimation(message) {
    const div = document.createElement('div');
    div.className = 'alert alert-hero-success animate-in';
    div.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
        background: var(--hero-gradient);
        color: white;
        padding: 15px 30px;
        border-radius: 50px;
        box-shadow: 0 10px 25px rgba(10, 132, 255, 0.4);
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 12px;
        pointer-events: none;
    `;
    div.innerHTML = `<i class="fas fa-check-circle h4 mb-0"></i> <span>${message}</span>`;
    document.body.appendChild(div);

    setTimeout(() => {
        div.style.opacity = '0';
        div.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => div.remove(), 500);
    }, 2500);
}

function showPointsAnimation(points) {
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const div = document.createElement('div');
            div.className = 'points-animation';
            div.innerHTML = `+${points}`;
            div.style.left = Math.random() * window.innerWidth + 'px';
            div.style.top = Math.random() * window.innerHeight + 'px';
            document.body.appendChild(div);

            setTimeout(() => div.remove(), 2000);
        }, i * 200);
    }

    // Confeti
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.background = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'][Math.floor(Math.random() * 5)];
            document.body.appendChild(confetti);

            setTimeout(() => confetti.remove(), 3000);
        }, i * 100);
    }
}

// Local Storage
function saveToLocalStorage() {
    safeStorage.setItem('superheroes_data', JSON.stringify({
        heroes,
        pointsHistory,
        availableAvatars,
        availableEmojis,
        availableMedals
    }));
}

function loadFromLocalStorage() {
    const data = safeStorage.getItem('superheroes_data');
    if (data) {
        try {
            const parsed = JSON.parse(data);
            heroes = parsed.heroes || [];
            pointsHistory = parsed.pointsHistory || [];
            availableAvatars = parsed.availableAvatars || availableAvatars;
            availableEmojis = parsed.availableEmojis || availableEmojis;
            availableMedals = parsed.availableMedals || availableMedals;
            nextMedalId = parsed.nextMedalId || 9;
            console.log('Datos cargados desde localStorage - Heroes:', heroes.length);
        } catch (e) {
            console.error('Error al parsear datos de localStorage:', e);
            heroes = [];
        }
    } else {
        heroes = [];
        console.log('No hay datos en localStorage');
    }

    // Cargar estado de autenticación
    const authStatus = safeStorage.getItem('isAuthenticated');
    isAuthenticated = authStatus === 'true';
}


// FUNCIONES DEL MÓDULO DE MEDALLAS

// Crear nueva medalla
function createNewMedal() {
    const name = document.getElementById('medalName').value.trim();
    const icon = document.getElementById('medalIcon').value.trim();
    const description = document.getElementById('medalDescription').value.trim();

    if (!name || !icon || !description) {
        alert('Por favor completa todos los campos');
        return;
    }

    const newMedal = {
        id: nextMedalId++,
        name: name,
        icon: icon,
        description: description
    };

    availableMedals.push(newMedal);
    saveToLocalStorage();

    // Cerrar modal y limpiar formulario
    const modal = bootstrap.Modal.getInstance(document.getElementById('createMedalModal'));
    if (modal) modal.hide();

    const form = document.getElementById('createMedalForm');
    if (form) form.reset();

    // Actualizar la sección de medallas
    populateMedalsSection();

    showSuccessAnimation(`¡Medalla "${name}" creada exitosamente!`);
}

// Poblar sección de medallas
function populateMedalsSection() {
    // Poblar selector de héroes
    const heroSelect = document.getElementById('medalHeroSelect');
    if (!heroSelect) {
        console.error('No se encontró el selector de héroes');
        return;
    }

    heroSelect.innerHTML = '<option value="">Selecciona un héroe...</option>';

    heroes.forEach(hero => {
        const option = document.createElement('option');
        option.value = hero.id;
        option.textContent = `${hero.heroName} (${hero.realName})`;
        heroSelect.appendChild(option);
    });

    // Poblar selección de medallas
    const medalSelection = document.getElementById('medalSelection');
    if (!medalSelection) {
        console.error('No se encontró el contenedor de selección de medallas');
        return;
    }

    medalSelection.innerHTML = '';

    availableMedals.forEach(medal => {
        const medalCard = document.createElement('div');
        medalCard.className = 'col-md-6 col-sm-4 mb-2';
        medalCard.innerHTML = `
            <div class="card text-center p-2 medal-option" data-medal-id="${medal.id}" style="cursor: pointer; border: 2px solid transparent;">
                <div style="font-size: 2rem;">${medal.icon}</div>
                <small>${medal.name}</small>
            </div>
        `;

        medalCard.querySelector('.medal-option').onclick = function() {
            document.querySelectorAll('.medal-option').forEach(el => {
                el.classList.remove('selected-medal');
                el.style.borderColor = 'transparent';
            });
            this.classList.add('selected-medal');
            this.style.borderColor = '#FFD700';
        };

        medalSelection.appendChild(medalCard);
    });

    // Poblar historial de medallas entregadas
    populateMedalsHistory();
}

// Entregar medalla
async function awardMedal() {
    const heroId = parseInt(document.getElementById('medalHeroSelect').value);
    const selectedMedalEl = document.querySelector('.medal-option.selected-medal');

    if (!heroId) {
        alert('Por favor selecciona un héroe');
        return;
    }

    if (!selectedMedalEl) {
        alert('Por favor selecciona una medalla');
        return;
    }

    const medalId = parseInt(selectedMedalEl.dataset.medalId);
    const medal = availableMedals.find(m => m.id === medalId);
    const hero = heroes.find(h => h.id === heroId);

    if (!medal || !hero) return;

    // Agregar medalla al héroe
    if (!hero.medals) hero.medals = [];

    // Verificar si ya tiene esta medalla
    const hasMedal = hero.medals.some(m => m.id === medalId);
    if (hasMedal) {
        alert('Este héroe ya tiene esta medalla');
        return;
    }

    const newMedals = [
        ...hero.medals,
        { ...medal, date: new Date() }
    ];

    try {
        if (API_CONFIG.useBackend) {
            await heroAPI.update(heroId, { medals: newMedals });
        }
        
        // Sincronizar y actualizar UI
        await syncWithBackend();
        populateMedalsSection();

        showSuccessAnimation(`¡${medal.name} entregada a ${hero.heroName}!`);

        // Limpiar selección
        document.getElementById('medalHeroSelect').value = '';
        document.querySelectorAll('.medal-option').forEach(el => {
            el.classList.remove('selected-medal');
            el.style.borderColor = 'transparent';
        });
    } catch (e) {
        console.error('Error al entregar medalla:', e);
        showErrorAnimation('No se pudo entregar la medalla en el servidor');
    }
}

// Quitar medalla
async function removeMedal(heroId, medalIndex) {
    if (!confirm('¿Estás seguro de que quieres quitar esta medalla?')) return;

    const hero = heroes.find(h => h.id === heroId);
    if (!hero || !hero.medals) return;

    const newMedals = [...hero.medals];
    newMedals.splice(medalIndex, 1);

    try {
        if (API_CONFIG.useBackend) {
            await heroAPI.update(heroId, { medals: newMedals });
        }
        
        await syncWithBackend();
        populateMedalsSection();

        showSuccessAnimation('Medalla quitada exitosamente');
    } catch (e) {
        console.error('Error al quitar medalla:', e);
        showErrorAnimation('No se pudo quitar la medalla en el servidor');
    }
}

// Poblar historial de medallas
function populateMedalsHistory() {
    const container = document.getElementById('medalsHistory');
    if (!container) return;

    container.innerHTML = '';

    let allMedals = [];

    heroes.forEach(hero => {
        if (hero.medals) {
            hero.medals.forEach((medal, index) => {
                allMedals.push({
                    hero: hero,
                    medal: medal,
                    medalIndex: index
                });
            });
        }
    });

    // Ordenar por fecha (más reciente primero)
    allMedals.sort((a, b) => new Date(b.medal.date) - new Date(a.medal.date));

    if (allMedals.length === 0) {
        container.innerHTML = '<p class="text-muted">Aún no se han entregado medallas</p>';
        return;
    }

    allMedals.forEach(item => {
        const medalCard = document.createElement('div');
        medalCard.className = 'card mb-2';
        medalCard.innerHTML = `
            <div class="card-body p-2">
                <div class="d-flex align-items-center">
                    <div style="font-size: 1.5rem; margin-right: 10px;">${item.medal.icon}</div>
                    <div class="flex-grow-1">
                        <strong>${item.medal.name}</strong>
                        <div class="text-muted small">${item.hero.heroName} - ${new Date(item.medal.date).toLocaleDateString()}</div>
                    </div>
                    <button class="btn btn-sm btn-danger" onclick="removeMedal(${item.hero.id}, ${item.medalIndex})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        container.appendChild(medalCard);
    });
}
// --- FUNCIONES DE CURSOS (Añadidas para corregir errores) ---

// Poblar los dropdowns de cursos en toda la app
function populateCourseDropdowns() {
    console.log('Poblando dropdowns de cursos...');
    const courseSelect = document.getElementById('course');
    const filterCourseSelect = document.getElementById('filterCourse');
    const medalHeroSelect = document.getElementById('medalHeroSelect');
    
    if (courseSelect) {
        courseSelect.innerHTML = COURSES_CONFIG.getSelectOptions();
    }
    
    if (filterCourseSelect) {
        filterCourseSelect.innerHTML = COURSES_CONFIG.getFilterOptions();
    }
}

// Refrescar la vista de cursos (agrupación de alumnos)
function refreshCourseView() {
    const container = document.getElementById('coursesContainer');
    if (!container) return;
    
    const levelFilter = document.getElementById('courseLevelFilter').value;
    const searchTerm = document.getElementById('courseSearch').value.toLowerCase();
    
    let heroesToGroup = heroes;
    
    // Filtrar por búsqueda si existe
    if (searchTerm) {
        heroesToGroup = heroes.filter(h => 
            h.realName.toLowerCase().includes(searchTerm) || 
            h.heroName.toLowerCase().includes(searchTerm)
        );
    }
    
    // Agrupar
    const grouped = COURSES_CONFIG.groupHeroesByCourse(heroesToGroup);
    
    // Filtrar por nivel si existe
    if (levelFilter) {
        const filteredGrouped = {};
        Object.keys(grouped).forEach(code => {
            if (grouped[code].course.level === parseInt(levelFilter)) {
                filteredGrouped[code] = grouped[code];
            }
        });
        container.innerHTML = COURSES_CONFIG.generateCourseView(filteredGrouped);
    } else {
        container.innerHTML = COURSES_CONFIG.generateCourseView(grouped);
    }
}

// Expandir/Colapsar alumnos en la vista de cursos
function toggleCourseHeroes(courseCode) {
    const container = document.querySelector(`.course-heroes[data-course="${courseCode}"]`);
    if (!container) return;
    
    const isExpanded = container.getAttribute('data-expanded') === 'true';
    const heroesInCourse = heroes.filter(h => h.course === courseCode);
    
    if (isExpanded) {
        container.innerHTML = COURSES_CONFIG.generateHeroesList(heroesInCourse, 3);
        container.setAttribute('data-expanded', 'false');
    } else {
        container.innerHTML = COURSES_CONFIG.generateHeroesList(heroesInCourse);
        container.setAttribute('data-expanded', 'true');
    }
}

// Agregar un nuevo curso dinámicamente
function addNewCourse() {
    const name = prompt('Nombre del curso (ej: 1° C):');
    if (!name) return;

    const code = prompt('Código único (ej: 1C):').toUpperCase();
    if (!code) return;
    
    // Verificar si ya existe
    if (COURSES_CONFIG.list.find(c => c.code === code)) {
        alert('Ese código de curso ya existe.');
        return;
    }
    
    const levelString = name.match(/(\d+)/);
    const level = levelString ? parseInt(levelString[1]) : 1;
    
    const section = name.split(' ').pop();
    
    const newCourse = { code, name, level, section };
    COURSES_CONFIG.list.push(newCourse);
    
    // Recargar dropdowns y vista
    populateCourseDropdowns();
    if (document.getElementById('coursesSection').style.display !== 'none') {
        refreshCourseView();
    }
    
    saveToLocalStorage();
    showSuccessAnimation(`Curso ${name} agregado correctamente`);
}

function showConfetti() {
    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * window.innerWidth + 'px';
            confetti.style.top = '-10px';
            confetti.style.background = ['#FFD60A', '#FF375F', '#0A84FF', '#32D74B', '#BF5AF2'][Math.floor(Math.random() * 5)];
            confetti.style.width = (Math.random() * 8 + 4) + 'px';
            confetti.style.height = (Math.random() * 12 + 6) + 'px';
            confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
            document.body.appendChild(confetti);

            setTimeout(() => confetti.remove(), 3000);
        }, i * 50);
    }
}

// --- PANEL DE CONTROL DE RAYOS (RÁPIDO) ---

// Poblar el panel de ajuste rápido de rayos
function populateQuickRayos() {
    const tbody = document.getElementById('quickRayosTableBody');
    if (!tbody) return;

    const searchTerm = document.getElementById('quickRayosSearch').value.toLowerCase();
    const courseFilter = document.getElementById('quickRayosCourseFilter').value;

    // Poblar el filtro de cursos si está vacío
    const courseSelect = document.getElementById('quickRayosCourseFilter');
    if (courseSelect && courseSelect.innerHTML.trim() === '') {
        courseSelect.innerHTML = COURSES_CONFIG.getFilterOptions();
    }

    tbody.innerHTML = '';

    const filteredHeroes = heroes.filter(hero => {
        const matchesSearch = hero.heroName.toLowerCase().includes(searchTerm) || hero.realName.toLowerCase().includes(searchTerm);
        const matchesCourse = !courseFilter || hero.course === courseFilter;
        return matchesSearch && matchesCourse;
    });

    if (filteredHeroes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted p-4">No se encontraron héroes</td></tr>';
        return;
    }

    filteredHeroes.forEach(hero => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="d-flex align-items-center">
                    <span class="fs-3 me-2">${hero.avatar}</span>
                    <div>
                        <div class="fw-bold">${hero.heroName}</div>
                        <div class="small text-muted">${hero.realName}</div>
                    </div>
                </div>
            </td>
            <td><span class="badge bg-light text-dark">${hero.course || 'N/A'}</span></td>
            <td class="text-center">
                <span class="fs-4 fw-bold text-warning">${hero.points}</span>
                <small class="text-muted">⚡</small>
            </td>
            <td>
                <div class="d-flex justify-content-center gap-2">
                    <button class="btn btn-sm btn-outline-danger px-2" onclick="quickAdjustRayos(${hero.id}, -3)" title="Quitar 3">-3</button>
                    <button class="btn btn-sm btn-outline-danger px-2" onclick="quickAdjustRayos(${hero.id}, -2)" title="Quitar 2">-2</button>
                    <button class="btn btn-sm btn-outline-danger px-2" onclick="quickAdjustRayos(${hero.id}, -1)" title="Quitar 1">-1</button>
                    <button class="btn btn-sm btn-outline-success px-2" onclick="quickAdjustRayos(${hero.id}, 1)" title="Sumar 1">+1</button>
                    <button class="btn btn-sm btn-outline-success px-2" onclick="quickAdjustRayos(${hero.id}, 2)" title="Sumar 2">+2</button>
                    <button class="btn btn-sm btn-outline-success px-2" onclick="quickAdjustRayos(${hero.id}, 3)" title="Sumar 3">+3</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

let pendingQuickAdjust = null;

// Ajustar rayos (ahora abre un modal para pedir motivo)
function quickAdjustRayos(heroId, amount) {
    const hero = heroes.find(h => h.id === heroId);
    if (!hero) return;

    pendingQuickAdjust = { heroId, amount };
    
    // Mostrar resumen en el modal
    const summaryEl = document.getElementById('quickRayosAmountSummary');
    if (summaryEl) {
        summaryEl.innerHTML = `${amount > 0 ? '+' : ''}${amount} ⚡ para ${hero.heroName}`;
        summaryEl.className = amount > 0 ? 'text-center h4 fw-bold text-success mb-0' : 'text-center h4 fw-bold text-danger mb-0';
    }
    
    // Limpiar input anterior
    document.getElementById('quickRayosReasonInput').value = '';
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('quickRayosReasonModal'));
    modal.show();
}

// Confirmar ajuste tras ingresar motivo
async function confirmQuickAdjust() {
    if (!pendingQuickAdjust) return;
    
    const { heroId, amount } = pendingQuickAdjust;
    const reason = document.getElementById('quickRayosReasonInput').value || (amount > 0 ? `Ajuste rápido (+${amount} ⚡)` : `Ajuste rápido (${amount} ⚡)`);
    const hero = heroes.find(h => h.id === heroId);
    
    if (!hero) return;

    // Cerrar modal
    const modalEl = document.getElementById('quickRayosReasonModal');
    const modal = bootstrap.Modal.getInstance(modalEl);
    if (modal) modal.hide();

    // Optimismo: actualizar UI inmediatamente
    const originalPoints = hero.points;
    hero.points += amount;
    populateQuickRayos();
    
    try {
        if (API_CONFIG.useBackend) {
            await heroAPI.update(heroId, { 
                points: hero.points,
                pointsHistory: {
                    create: {
                        points: amount,
                        reason: reason,
                        date: new Date()
                    }
                }
            });
            // Sincronizar para asegurar coherencia
            await syncWithBackend();
            populateQuickRayos();
            updateStats();
        } else {
            saveToLocalStorage();
            updateStats();
        }
        
        if (amount > 0 && typeof showPointsAnimation === 'function') {
            showPointsAnimation(amount);
        }
        
        pendingQuickAdjust = null;
    } catch (e) {
        console.error('Error al ajustar rayos:', e);
        // Revertir si falló
        hero.points = originalPoints;
        populateQuickRayos();
        showErrorAnimation('No se pudo guardar el cambio');
    }
}

// --- GESTIÓN DE TAREAS PROGRAMADAS (CRON) ---

// Poblar logs de tareas programadas
async function populateCronLogs() {
    const tbody = document.getElementById('cronLogsBody');
    if (!tbody) return;

    // 1. Obtener configuración actual del servidor
    try {
        const response = await fetch('/api/system/config');
        const config = await response.json();
        currentSystemConfig = config;
        updateCronDisplay();
    } catch (e) {
        console.error('Error al cargar config de cron:', e);
    }

    tbody.innerHTML = '';

    // Extraer todas las entradas de historial que sean automáticas
    let allAutomatedHistory = [];
    heroes.forEach(hero => {
        if (hero.pointsHistory) {
            hero.pointsHistory.forEach(entry => {
                // Verificar si la razón contiene "Asignación" y "automática" o "semanal"
                const isAuto = entry.reason && (
                    (entry.reason.includes('Asignación') && entry.reason.includes('automática')) || 
                    entry.reason.includes('Asignación semanal')
                );
                
                if (isAuto) {
                    allAutomatedHistory.push({
                        ...entry,
                        heroName: hero.heroName
                    });
                }
            });
        }
    });

    // Agrupar por minuto y motivo (para identificar ejecuciones masivas)
    const groupedLogs = {};
    allAutomatedHistory.forEach(entry => {
        const date = new Date(entry.date);
        // Usamos año-mes-día hora:minuto como clave de grupo
        const dateKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;
        const groupKey = `${dateKey} | ${entry.reason}`;
        
        if (!groupedLogs[groupKey]) {
            groupedLogs[groupKey] = {
                date: entry.date,
                reason: entry.reason,
                points: entry.points,
                heroes: []
            };
        }
        groupedLogs[groupKey].heroes.push(entry.heroName);
    });

    // Ordenar por fecha descendente
    const sortedLogs = Object.values(groupedLogs).sort((a, b) => new Date(b.date) - new Date(a.date));

    if (sortedLogs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted p-4">No se han registrado ejecuciones automáticas aún</td></tr>';
        return;
    }

    sortedLogs.forEach(log => {
        const row = document.createElement('tr');
        const dateStr = new Date(log.date).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        row.innerHTML = `
            <td>${dateStr}</td>
            <td>${log.reason.includes('semanal') ? '<span class="badge bg-success">Semanal</span>' : '<span class="badge bg-primary">Diaria</span>'}</td>
            <td class="fw-bold text-warning">${log.points} ⚡</td>
            <td>${log.heroes.length} héroes</td>
            <td>
                <button class="btn btn-sm btn-outline-info" onclick="alert('Héroes afectados:\\n\\n${log.heroes.join(', ')}')">
                    <i class="fas fa-eye"></i> Ver Detalle
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Actualizar vista de configuración cron
function updateCronDisplay() {
    if (!currentSystemConfig) return;

    const hour = currentSystemConfig.cronHour;
    const hourStr = hour < 12 ? `${hour}:00 AM` : (hour === 12 ? '12:00 PM' : `${hour - 12}:00 PM`);
    
    document.getElementById('displayCronHour').textContent = hourStr;
    document.getElementById('displayCronAmount').textContent = `${currentSystemConfig.cronAmount} Rayos`;
    document.getElementById('displayCronBonus').textContent = `+${currentSystemConfig.cronBonus} Rayos`;

    // Cargar en inputs también
    document.getElementById('inputCronHour').value = currentSystemConfig.cronHour;
    document.getElementById('inputCronAmount').value = currentSystemConfig.cronAmount;
    document.getElementById('inputCronBonus').value = currentSystemConfig.cronBonus;
}

// Alternar edición de cron
function toggleCronEdit(editing) {
    document.getElementById('cronConfigDisplay').style.display = editing ? 'none' : 'block';
    document.getElementById('cronConfigEdit').style.display = editing ? 'block' : 'none';
}

// Guardar configuración de cron
async function saveCronConfig() {
    const cronAmount = document.getElementById('inputCronAmount').value;
    const cronHour = document.getElementById('inputCronHour').value;
    const cronBonus = document.getElementById('inputCronBonus').value;

    try {
        const response = await fetch('/api/system/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cronAmount, cronHour, cronBonus })
        });

        if (response.ok) {
            currentSystemConfig = await response.json();
            updateCronDisplay();
            toggleCronEdit(false);
            showSuccessAnimation('Configuración guardada');
        } else {
            showErrorAnimation('Error al guardar');
        }
    } catch (e) {
        console.error('Error:', e);
        showErrorAnimation('Error de conexión');
    }
}

// Ejecutar tarea programada manualmente
async function triggerCronManual() {
    if (!confirm('¿Deseas ejecutar la asignación de rayos manualmente ahora mismo?')) return;

    try {
        showSuccessAnimation('Iniciando asignación manual...');
        const response = await fetch('/api/cron/process-rayos', {
            headers: { 'x-manual-trigger': 'true' }
        });
        const data = await response.json();

        if (data.success) {
            showSuccessAnimation('¡Tarea completada con éxito!');
            await syncWithBackend();
            if (document.getElementById('cronSection').style.display !== 'none') {
                populateCronLogs();
            }
            updateStats();
        } else {
            throw new Error(data.error || 'Error desconocido');
        }
    } catch (e) {
        console.error('Error al ejecutar cron manual:', e);
        showErrorAnimation('Error al ejecutar la tarea manual');
    }
}

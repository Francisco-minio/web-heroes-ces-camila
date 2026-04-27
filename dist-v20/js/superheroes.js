// Academia de Superhéroes - Sistema Centralizado PHP
// Configuración y Variables de Estado
let currentView = 'admin'; 
let heroes = [];
let pointsHistory = [];
let currentUser = null;
let currentSystemConfig = null;
let isAuthenticated = false;

// Utilidad de Persistencia Segura
const safeStorage = {
    getItem: (key) => {
        try { return localStorage.getItem(key); } catch (e) { return null; }
    },
    setItem: (key, value) => {
        try { localStorage.setItem(key, value); } catch (e) { }
    },
    removeItem: (key) => {
        try { localStorage.removeItem(key); } catch (e) { }
    }
};

// Notificaciones Visuales
function showSuccessAnimation(message) {
    const div = document.createElement('div');
    div.className = 'alert alert-success position-fixed top-0 start-50 translate-middle-x mt-3 hero-glow-green';
    div.style.zIndex = '9999';
    div.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

function showErrorAnimation(message) {
    const div = document.createElement('div');
    div.className = 'alert alert-danger position-fixed top-0 start-50 translate-middle-x mt-3 hero-glow-red';
    div.style.zIndex = '9999';
    div.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

const API_PATH = 'api/'; 

// Catálogo Visual
const AVAILABLE_AVATARS = ['🦸', '🦹', '🐉', '⚡', '🌪️', '🛡️', '🧙', '🧚', '🦸‍♀️', '🦹‍♀️', '🔥', '💫', '🌟', '💪', '🧠', '❤️'];
const AVAILABLE_EMOJIS = ['⭐', '🔥', '💪', '🧠', '❤️', '🌈', '🎯', '🎨', '🌍', '🚀', '🔬', '📚', '🎭', '🏆', '🎪', '🎨'];
const AVAILABLE_MEDALS = [
    { id: 1, name: 'Medalla de Oro', icon: '🥇', description: 'Excelente rendimiento' },
    { id: 2, name: 'Medalla de Plata', icon: '🥈', description: 'Buena participación' },
    { id: 3, name: 'Medalla de Bronce', icon: '🥉', description: 'Esfuerzo constante' },
    { id: 4, name: 'Estrella de Honor', icon: '⭐', description: 'Liderazgo' }
];

// API Engine - Abstracción para Backend PHP/MySQL
const heroAPI = {
    async getAll() {
        const response = await fetch(`${API_PATH}heroes.php`);
        return await response.json();
    },
    async getById(id) {
        const response = await fetch(`${API_PATH}heroes.php?id=${id}`);
        return await response.json();
    },
    async create(heroData) {
        const response = await fetch(`${API_PATH}heroes.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(heroData)
        });
        return await response.json();
    },
    async update(id, heroData) {
        const response = await fetch(`${API_PATH}heroes.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...heroData, id: id })
        });
        return await response.json();
    },
    async delete(id) {
        const response = await fetch(`${API_PATH}heroes.php?id=${id}`, {
            method: 'DELETE'
        });
        return await response.json();
    },
    async assignPoints(heroId, points, reason) {
        const response = await fetch(`${API_PATH}points.php?hero_id=${heroId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ points, reason })
        });
        return await response.json();
    }
};

// Credenciales Centralizadas
const ADMIN_CREDENTIALS = {
    get username() { return (window.APP_CONFIG && window.APP_CONFIG.ADMIN_USERNAME) || 'profesor'; },
    get password() { return (window.APP_CONFIG && window.APP_CONFIG.ADMIN_PASSWORD) || 'heroes2024'; }
};

// Inicialización
document.addEventListener('DOMContentLoaded', async function() {
    await syncWithBackend();
    checkAuthentication();
    updateStats();
    populateHeroesTable();
    populateAvatarSelection();
    populateEmojiSelector();
    populateCourseDropdowns();
    
    if (currentView === 'student') updateStudentView();
    else updateDashboard();
});

// Sincronizar datos con el backend (PHP)
async function syncWithBackend() {
    try {
        const response = await fetch(`${API_PATH}heroes.php`);
        const data = await response.json();
        if (Array.isArray(data)) {
            heroes = data;
            console.log('Sincronizado con PHP:', heroes.length, 'héroes');
        }
    } catch (e) {
        console.error('Error sincronizando con PHP:', e);
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
// Mostrar modal de autenticación
function showAuthModal() {
    const modalEl = document.getElementById('authModal');
    if (!modalEl) return;
    
    const authModal = new bootstrap.Modal(modalEl);
    authModal.show();
    
    // Ocultar todo mientras no se autentique
    const sidebar = document.getElementById('sidebar');
    const mainWrapper = document.querySelector('.main-wrapper');
    if (sidebar) sidebar.style.display = 'none';
    if (mainWrapper) mainWrapper.style.display = 'none';
}

// Autenticar Profesor
function authenticate() {
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;

    if (user === ADMIN_CREDENTIALS.username && pass === ADMIN_CREDENTIALS.password) {
        isAuthenticated = true;
        safeStorage.setItem('isAuthenticated', 'true');
        showAdminDashboard();
        showSuccessAnimation('¡Comando Central Activado!');
        const modal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
        if (modal) modal.hide();
    } else {
        showErrorAnimation('Acceso Denegado. Credenciales incorrectas.');
    }
}

// Autenticar Estudiante (Héroe)
function authenticateHero() {
    const heroName = document.getElementById('heroUsername').value.trim();
    const heroPass = document.getElementById('heroPassword').value.trim();

    const hero = heroes.find(h => 
        h.heroName.toLowerCase() === heroName.toLowerCase() && 
        (h.password === heroPass || h.realName === heroPass)
    );

    if (hero) {
        currentUser = hero;
        safeStorage.setItem('currentHeroId', hero.id);
        showStudentView();
        showSuccessAnimation(`¡Bienvenido de vuelta, ${hero.heroName}!`);
        const modal = bootstrap.Modal.getInstance(document.getElementById('authModal'));
        if (modal) modal.hide();
    } else {
        showErrorAnimation('Héroe no encontrado o clave incorrecta.');
    }
}

// Navegación de Vistas
function showAdminDashboard() {
    const sidebar = document.getElementById('sidebar');
    const mainWrapper = document.querySelector('.main-wrapper');
    
    if (sidebar) sidebar.style.display = 'flex';
    if (mainWrapper) mainWrapper.style.display = 'block';
    
    // Ocultar vista de estudiante y mostrar dashboard
    const studentView = document.getElementById('studentView');
    if (studentView) studentView.style.display = 'none';
    
    currentView = 'admin';
    showSection('dashboard');
}

function showStudentView() {
    const sidebar = document.getElementById('sidebar');
    const mainWrapper = document.querySelector('.main-wrapper');
    
    if (sidebar) sidebar.style.display = 'none';
    if (mainWrapper) mainWrapper.style.display = 'block';
    
    // Ocultar todas las secciones de admin y mostrar studentView
    document.querySelectorAll('.content-section').forEach(s => s.style.display = 'none');
    const studentView = document.getElementById('studentView');
    if (studentView) studentView.style.display = 'block';
    
    currentView = 'student';
    updateStudentView();
}

function logout() {
    if (confirm('¿Cerrar sesión en el Comando Central?')) {
        isAuthenticated = false;
        safeStorage.setItem('isAuthenticated', 'false');
        safeStorage.removeItem('currentHeroId');
        currentUser = null;
        window.location.reload();
    }
}

// Gestión de Cursos
async function populateCourseDropdowns() {
    try {
        const response = await fetch(`${API_PATH}courses.php`);
        const courses = await response.json();
        
        const dropdowns = ['heroCourse', 'quickRayosCourseFilter', 'filterCourse'];
        dropdowns.forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            
            const currentVal = el.value;
            el.innerHTML = id === 'heroCourse' ? '' : '<option value="">Todos los Cursos</option>';
            
            courses.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                el.appendChild(opt);
            });
            if (currentVal) el.value = currentVal;
        });
        
        window.COURSES_CACHE = courses; // Guardar para uso rápido
    } catch (e) {
        console.error('Error cargando cursos:', e);
    }
}

async function refreshCourseView() {
    const container = document.getElementById('tabCourses');
    if (!container) return;

    await populateCourseDropdowns();
    const courses = window.COURSES_CACHE || [];

    let html = `
        <div class="d-flex justify-content-between align-items-center mb-4">
            <h5 class="mb-0">Gestión de Cursos</h5>
            <button class="btn btn-success btn-sm" onclick="showAddCourseForm()">
                <i class="fas fa-plus"></i> Nuevo Curso
            </button>
        </div>
        <div class="row g-3">
    `;

    courses.forEach(c => {
        html += `
            <div class="col-md-4">
                <div class="card bg-glass-dark border-secondary">
                    <div class="card-body d-flex justify-content-between align-items-center">
                        <div>
                            <div class="fw-bold text-info">${c.name}</div>
                            <div class="xsmall text-muted">ID: ${c.id} | ${c.level}</div>
                        </div>
                        <button class="btn btn-link text-danger p-0" onclick="deleteCourse('${c.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

async function showAddCourseForm() {
    const id = prompt("Ingresa el ID del curso (ej: 3A):");
    const name = prompt("Nombre del curso (ej: Tercero A):");
    if (!id || !name) return;

    try {
        const response = await fetch(`${API_PATH}courses.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, name, level: 'Básico' })
        });
        if (response.ok) {
            showSuccessAnimation('Curso agregado');
            refreshCourseView();
        }
    } catch (e) {
        showErrorAnimation('Error al crear curso');
    }
}

async function deleteCourse(id) {
    if (!confirm(`¿Eliminar el curso ${id}?`)) return;
    try {
        await fetch(`${API_PATH}courses.php?id=${id}`, { method: 'DELETE' });
        refreshCourseView();
    } catch (e) {
        showErrorAnimation('Error al eliminar');
    }
}

// Cambiar de sección en el panel
function showSection(section) {
    console.log('Mostrando sección:', section);
    
    // Ocultar todas las secciones
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(s => s.style.display = 'none');

    // Actualizar menú activo
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick').includes(`'${section}'`)) {
            item.classList.add('active');
        }
    });

    // Mapeo de secciones nuevas a contenedores
    const sectionMap = {
        'dashboard': 'dashboardSection',
        'management': 'managementSection',
        'ranking': 'rankingSection',
        'history': 'historySection'
    };

    const targetId = sectionMap[section] || 'dashboardSection';
    const targetEl = document.getElementById(targetId);

    if (targetEl) {
        targetEl.style.display = 'block';
        
        // Actualizar título de la sección
        const titleMap = {
            'dashboard': 'Dashboard General',
            'management': 'Centro de Control',
            'ranking': 'Hall de la Fama',
            'history': 'Auditoría de Acciones'
        };
        document.getElementById('sectionTitle').textContent = titleMap[section] || 'Panel de Control';

        // Poblar datos iniciales según la sección
        if (section === 'dashboard') updateDashboard();
        if (section === 'management') populateHeroesTable();
        if (section === 'ranking') updateRankings('daily');
        if (section === 'history') populatePointsHistory();
    }
}

// Actualizar estadísticas globales y Dashboard
function updateStats() {
    const totalHeroesEl = document.getElementById('totalHeroes');
    if (!totalHeroesEl) return;

    totalHeroesEl.textContent = heroes.length;
    document.getElementById('totalPoints').textContent = heroes.reduce((sum, hero) => sum + hero.points, 0);
    document.getElementById('activeMissions').textContent = heroes.length > 0 ? 'En curso' : 'Sin misiones';

    const sortedHeroes = [...heroes].sort((a, b) => b.points - a.points);
    const topHeroElement = document.getElementById('topHeroName');
    if (topHeroElement) {
        topHeroElement.textContent = sortedHeroes.length > 0 ? sortedHeroes[0].heroName : '--';
    }
}

// Poblar el Dashboard con Ranking compacto y actividad
function updateDashboard() {
    updateStats();
    
    // 1. Ranking Compacto (Top 5)
    const list = document.getElementById('top5RankingList');
    if (!list) return;

    const top5 = [...heroes].sort((a, b) => b.points - a.points).slice(0, 5);
    list.innerHTML = '';

    top5.forEach((hero, index) => {
        const div = document.createElement('div');
        div.className = 'ranking-item-compact';
        div.innerHTML = `
            <div class="fw-bold text-warning" style="width: 25px;">#${index + 1}</div>
            <div class="fs-4">${hero.avatar}</div>
            <div class="flex-grow-1">
                <div class="fw-bold small">${hero.heroName}</div>
                <div class="xsmall text-muted">${hero.course || 'Héroe'}</div>
            </div>
            <div class="badge bg-glass-blue text-info">${hero.points} ⚡</div>
        `;
        list.appendChild(div);
    });

    // 2. Actividad Reciente (Mapear puntos history)
    const activityList = document.getElementById('recentActivityList');
    if (!activityList) return;

    let history = [];
    heroes.forEach(h => {
        if (h.pointsHistory) {
            h.pointsHistory.forEach(p => history.push({ ...p, heroName: h.heroName }));
        }
    });

    const recent = history.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6);
    activityList.innerHTML = '';

    recent.forEach(act => {
        const li = document.createElement('li');
        li.className = 'list-group-item bg-transparent border-0 border-bottom border-secondary-subtle py-3';
        li.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <div class="fw-bold small text-white">${act.heroName}</div>
                    <div class="xsmall text-muted">${act.reason}</div>
                </div>
                <div class="text-end">
                    <div class="small ${act.points > 0 ? 'text-success' : 'text-danger'} fw-bold">${act.points > 0 ? '+' : ''}${act.points}</div>
                    <div class="xsmall text-muted">${new Date(act.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            </div>
        `;
        activityList.appendChild(li);
    });
}

// --- GESTIÓN DE HÉROES (MODALES Y ACCIONES) ---

// Mostrar formulario para nuevo héroe
function showAddHeroForm() {
    const form = document.getElementById('heroForm');
    if (form) form.reset();
    document.getElementById('heroId').value = '';
    document.getElementById('heroModalLabel').textContent = 'Registrar Nuevo Héroe';
    document.getElementById('heroAvatarDisplay').textContent = '🦸';
    
    const modal = new bootstrap.Modal(document.getElementById('heroModal'));
    modal.show();
}

// Editar héroe existente
async function editHero(id) {
    try {
        const hero = await heroAPI.getById(id);
        if (hero) {
            document.getElementById('heroId').value = hero.id;
            document.getElementById('realName').value = hero.realName;
            document.getElementById('heroName').value = hero.heroName;
            document.getElementById('heroCourse').value = hero.course || '';
            document.getElementById('superPower').value = hero.superPower || '';
            document.getElementById('heroNewPassword').value = hero.password || '';
            document.getElementById('heroAvatarDisplay').textContent = hero.avatar || '🦸';
            document.getElementById('heroModalLabel').textContent = 'Editar Héroe';
            
            const modal = new bootstrap.Modal(document.getElementById('heroModal'));
            modal.show();
        }
    } catch (e) {
        console.error('Error al cargar héroe para editar:', e);
    }
}

// Guardar (Crear o Actualizar) héroe
async function saveHero() {
    const heroId = document.getElementById('heroId').value;
    const heroData = {
        realName: document.getElementById('realName').value,
        heroName: document.getElementById('heroName').value,
        username: document.getElementById('heroName').value.toLowerCase().replace(/\s+/g, ''),
        password: document.getElementById('heroNewPassword').value,
        course: document.getElementById('heroCourse').value,
        superPower: document.getElementById('superPower').value,
        avatar: document.getElementById('heroAvatarDisplay').textContent
    };

    try {
        let result;
        if (heroId) {
            result = await heroAPI.update(heroId, heroData);
        } else {
            result = await heroAPI.create(heroData);
        }

        if (result) {
            const modalEl = document.getElementById('heroModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
            
            showSuccessAnimation(heroId ? 'Héroe actualizado' : 'Héroe creado');
            await syncWithBackend();
            populateHeroesTable();
            updateDashboard();
        }
    } catch (e) {
        console.error('Error al guardar héroe:', e);
        alert('Error al guardar los datos');
    }
}

// Eliminar héroe
async function deleteHero(id) {
    if (confirm('¿Estás seguro de que deseas eliminar este héroe? Esta acción no se puede deshacer.')) {
        try {
            const result = await heroAPI.delete(id);
            if (result.success) {
                showSuccessAnimation('Héroe eliminado');
                await syncWithBackend();
                populateHeroesTable();
                updateDashboard();
            }
        } catch (e) {
            console.error('Error al eliminar héroe:', e);
        }
    }
}
// Poblar tabla de héroes
function populateHeroesTable() {
    const tbody = document.getElementById('heroesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    heroes.forEach(hero => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="fs-3">${hero.avatar || '🦸'}</span></td>
            <td>${hero.realName}</td>
            <td class="fw-bold text-info">${hero.heroName}</td>
            <td><span class="badge bg-secondary">${hero.course || 'N/A'}</span></td>
            <td><span class="badge bg-warning text-dark">${hero.points} ⚡</span></td>
            <td>
                <button class="btn btn-sm btn-outline-info me-1" onclick="editHero(${hero.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteHero(${hero.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
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

// --- DINAMISMO Y VISTAS ---

function populateAvatarSelection() {
    const container = document.getElementById('avatarSelection');
    if (!container) return;
    container.innerHTML = '';
    AVAILABLE_AVATARS.forEach(avatar => {
        const div = document.createElement('div');
        div.className = 'avatar-option';
        div.innerHTML = avatar;
        div.onclick = () => {
            document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            document.getElementById('heroAvatarDisplay').textContent = avatar;
        };
        container.appendChild(div);
    });
}

function updateStudentView() {
    if (!currentUser) return;
    
    document.getElementById('studentHeroName').textContent = currentUser.heroName;
    document.getElementById('studentAvatar').textContent = currentUser.avatar || '🦸';
    document.getElementById('studentPoints').textContent = currentUser.points || 0;
    
    // Contar medallas (extraer del historial de puntos)
    let medals = [];
    if (currentUser.pointsHistory) {
        medals = currentUser.pointsHistory.filter(h => h.reason.includes('Medalla'));
    }
    document.getElementById('studentMedalsCount').textContent = medals.length;

    // Mostrar Medallas en Grid
    const medalsGrid = document.getElementById('studentMedalsGrid');
    if (medalsGrid) {
        medalsGrid.innerHTML = '';
        if (medals.length === 0) {
            medalsGrid.innerHTML = '<div class="col-12 text-center p-4 text-muted small">Aún no has ganado medallas. ¡Sigue esforzándote!</div>';
        } else {
            medals.forEach(m => {
                const col = document.createElement('div');
                col.className = 'col-md-3 col-6';
                col.innerHTML = `
                    <div class="medal-card-mini p-2 text-center">
                        <div class="fs-2">${m.reason.split(' ').pop()}</div>
                        <div class="xsmall fw-bold text-truncate">${m.reason.replace('Medalla Otorgada: ', '')}</div>
                    </div>
                `;
                medalsGrid.appendChild(col);
            });
        }
    }
    
    // Historial del estudiante
    const historyList = document.getElementById('studentHistoryList');
    if (historyList && currentUser.pointsHistory) {
        historyList.innerHTML = '';
        currentUser.pointsHistory.slice(-5).reverse().forEach(entry => {
            const li = document.createElement('li');
            li.className = 'list-group-item bg-transparent text-white border-0 border-bottom border-secondary-subtle py-2';
            li.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <div class="small fw-bold">${entry.reason}</div>
                        <div class="xsmall text-muted">${new Date(entry.date).toLocaleDateString()}</div>
                    </div>
                    <div class="badge bg-glass-blue text-info">${entry.points > 0 ? '+' : ''}${entry.points} ⚡</div>
                </div>
            `;
            historyList.appendChild(li);
        });
    }
}

// Poblar selector de emojis
function populateEmojiSelector() {
    const container = document.getElementById('emojiSelector');
    if (!container) return;
    container.innerHTML = '';

    AVAILABLE_EMOJIS.forEach(emoji => {
        const btn = document.createElement('button');
        btn.className = 'emoji-btn';
        btn.innerHTML = emoji;
        btn.onclick = function() {
            this.classList.toggle('selected');
        };
        container.appendChild(btn);
    });
}

// Poblar medallas disponibles
function populateMedalsGrid() {
    const grid = document.getElementById('availableMedalsGrid');
    if (!grid) return;
    grid.innerHTML = '';
    AVAILABLE_MEDALS.forEach(medal => {
        const col = document.createElement('div');
        col.className = 'col-6';
        col.innerHTML = `
            <div class="medal-card p-3 text-center" onclick="awardMedalAction(${medal.id})">
                <div class="fs-2">${medal.icon}</div>
                <div class="small fw-bold">${medal.name}</div>
            </div>
        `;
        grid.appendChild(col);
    });
}

// Las funciones de gestión ya están definidas arriba

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
        // Enviar al servidor PHP
        const promises = heroIds.map(async (id) => {
            const hero = heroes.find(h => h.id === id);
            return await fetch(`${API_PATH}points.php?hero_id=${hero.id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    points: points,
                    reason: reason
                })
            });
        });
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
async function addNewCourse() {
    const name = prompt('Nombre del curso (ej: Primero C):');
    if (!name) return;

    const id = prompt('Código único (ej: 1C):').toUpperCase();
    if (!id) return;
    
    try {
        const response = await fetch(`${API_PATH}courses.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, name, level: 'Básico' })
        });
        if (response.ok) {
            showSuccessAnimation(`Curso ${name} agregado correctamente`);
            refreshCourseView();
            populateCourseDropdowns();
        }
    } catch (e) {
        showErrorAnimation('Error al crear curso');
    }
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

    // El filtro de cursos se puebla mediante populateCourseDropdowns()
    // que se llama al inicio de la carga del DOM.

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

    // Mostrar estado de carga en el panel de config
    const displayHour = document.getElementById('displayCronHour');
    if (displayHour && displayHour.textContent === '--:-- AM') {
        displayHour.textContent = 'Cargando...';
    }

    // 1. Obtener configuración actual del servidor
    try {
        const response = await fetch(`${API_PATH}system_config.php`);
        if (!response.ok) throw new Error('Fallo al conectar con el servidor');
        
        const config = await response.json();
        if (config && !config.error) {
            currentSystemConfig = config;
            updateCronDisplay();
        } else {
            console.error('Configuración inválida:', config);
        }
    } catch (e) {
        console.error('Error al cargar config de cron:', e);
        if (displayHour) displayHour.textContent = 'Error al cargar';
    }

    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-4"><div class="spinner-border spinner-border-sm text-primary"></div> Cargando historial...</td></tr>';

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
    if (editing) {
        // Asegurar que haya valores si falló la carga inicial
        if (!document.getElementById('inputCronHour').value) {
            document.getElementById('inputCronHour').value = 5;
            document.getElementById('inputCronAmount').value = 3;
            document.getElementById('inputCronBonus').value = 3;
        }
    }
    document.getElementById('cronConfigDisplay').style.display = editing ? 'none' : 'block';
    document.getElementById('cronConfigEdit').style.display = editing ? 'block' : 'none';
}

// Guardar configuración de cron
async function saveCronConfig() {
    const cronAmount = parseInt(document.getElementById('inputCronAmount').value);
    const cronHour = parseInt(document.getElementById('inputCronHour').value);
    const cronBonus = parseInt(document.getElementById('inputCronBonus').value);

    // Validaciones básicas
    if (isNaN(cronAmount) || isNaN(cronHour) || isNaN(cronBonus)) {
        showErrorAnimation('Por favor ingresa valores numéricos válidos');
        return;
    }

    if (cronHour < 0 || cronHour > 23) {
        showErrorAnimation('La hora debe estar entre 0 y 23');
        return;
    }

    try {
        console.log('Enviando configuración:', { cronAmount, cronHour, cronBonus });
        const response = await fetch(`${API_PATH}system_config.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cronAmount, cronHour, cronBonus })
        });

        const data = await response.json();

        if (response.ok) {
            currentSystemConfig = data;
            updateCronDisplay();
            toggleCronEdit(false);
            showSuccessAnimation('Configuración guardada correctamente');
            populateCronLogs(); // Refrescar logs
        } else {
            console.error('Error del servidor:', data);
            showErrorAnimation('Error del servidor: ' + (data.error || 'Error desconocido'));
        }
    } catch (e) {
        console.error('Error de red/conexión:', e);
        showErrorAnimation('No se pudo conectar con el servidor');
    }
}

// Ejecutar tarea programada manualmente
async function triggerCronManual() {
    if (!confirm('¿Deseas ejecutar la asignación de rayos manualmente ahora mismo?')) return;

    try {
        showSuccessAnimation('Iniciando asignación manual...');
        const response = await fetch(`${API_PATH}cron_process.php?manual=true`, {
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

// Configuración de cursos - Superhéroes App
// Centralizar la gestión de cursos para facilitar mantenimiento

const COURSES_CONFIG = {
    // Lista de cursos disponibles
    list: [
        { code: '1A', name: '1° A', level: 1, section: 'A' },
        { code: '1B', name: '1° B', level: 1, section: 'B' },
        { code: '2A', name: '2° A', level: 2, section: 'A' },
        { code: '2B', name: '2° B', level: 2, section: 'B' },
        { code: '3A', name: '3° A', level: 3, section: 'A' },
        { code: '3B', name: '3° B', level: 3, section: 'B' },
        { code: '4A', name: '4° A', level: 4, section: 'A' },
        { code: '4B', name: '4° B', level: 4, section: 'B' },
        { code: '5A', name: '5° A', level: 5, section: 'A' },
        { code: '5B', name: '5° B', level: 5, section: 'B' },
        { code: '6A', name: '6° A', level: 6, section: 'A' },
        { code: '6B', name: '6° B', level: 6, section: 'B' }
    ],
    
    // Obtener todos los cursos para select
    getSelectOptions() {
        let options = '<option value="">Seleccionar...</option>';
        this.list.forEach(course => {
            options += `<option value="${course.code}">${course.name}</option>`;
        });
        return options;
    },
    
    // Obtener opciones para filtro
    getFilterOptions() {
        let options = '<option value="">Todos los cursos</option>';
        this.list.forEach(course => {
            options += `<option value="${course.code}">${course.name}</option>`;
        });
        return options;
    },
    
    // Obtener información de un curso por código
    getCourseByCode(code) {
        return this.list.find(c => c.code === code);
    },
    
    // Obtener cursos por nivel
    getCoursesByLevel(level) {
        return this.list.filter(c => c.level === level);
    },
    
    // Agrupar héroes por curso
    groupHeroesByCourse(heroes) {
        const grouped = {};
        
        // Inicializar todos los cursos
        this.list.forEach(course => {
            grouped[course.code] = {
                course: course,
                heroes: [],
                totalPoints: 0,
                averagePoints: 0
            };
        });
        
        // Agrupar héroes
        heroes.forEach(hero => {
            if (grouped[hero.course]) {
                grouped[hero.course].heroes.push(hero);
                grouped[hero.course].totalPoints += hero.points || 0;
            }
        });
        
        // Calcular promedios
        Object.keys(grouped).forEach(courseCode => {
            const course = grouped[courseCode];
            if (course.heroes.length > 0) {
                course.averagePoints = Math.round(course.totalPoints / course.heroes.length);
            }
        });
        
        return grouped;
    },
    
    // Generar HTML para vista por cursos
    generateCourseView(groupedCourses) {
        let html = '<div class="row">';
        
        this.list.forEach(course => {
            const courseData = groupedCourses[course.code];
            const heroCount = courseData.heroes.length;
            const avgPoints = courseData.averagePoints;
            
            html += `
                <div class="col-md-6 col-lg-4 mb-4">
                    <div class="card border-primary">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">
                                <i class="fas fa-users"></i> ${course.name}
                                <span class="badge bg-light text-dark float-end">${heroCount} alumnos</span>
                            </h5>
                        </div>
                        <div class="card-body">
                            <div class="row text-center mb-3">
                                <div class="col-6">
                                    <small class="text-muted">Puntos Promedio</small>
                                    <div class="h4 text-primary">${avgPoints}</div>
                                </div>
                                <div class="col-6">
                                    <small class="text-muted">Puntos Totales</small>
                                    <div class="h4 text-success">${courseData.totalPoints}</div>
                                </div>
                            </div>
                            
                            <div class="course-heroes" data-course="${course.code}">
                                ${this.generateHeroesList(courseData.heroes, 3)}
                            </div>
                            
                            ${heroCount > 3 ? `
                                <button class="btn btn-outline-primary btn-sm w-100 mt-2" 
                                        onclick="toggleCourseHeroes('${course.code}')">
                                    <i class="fas fa-eye"></i> Ver todos (${heroCount})
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        return html;
    },
    
    // Generar lista de héroes para un curso
    generateHeroesList(heroes, limit = null) {
        const displayHeroes = limit ? heroes.slice(0, limit) : heroes;
        
        if (displayHeroes.length === 0) {
            return '<p class="text-muted">No hay alumnos en este curso</p>';
        }
        
        let html = '<div class="list-group list-group-flush">';
        displayHeroes.forEach(hero => {
            html += `
                <div class="list-group-item d-flex justify-content-between align-items-center">
                    <div>
                        <span style="font-size: 1.5rem;">${hero.avatar}</span>
                        <strong>${hero.heroName}</strong>
                        <small class="text-muted d-block">${hero.realName}</small>
                    </div>
                    <span class="badge bg-warning text-dark">${hero.points} pts</span>
                </div>
            `;
        });
        html += '</div>';
        
        return html;
    }
};

// Exportar para uso global
window.COURSES_CONFIG = COURSES_CONFIG;

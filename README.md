# 🦸‍♀️ Academia de Superhéroes - Liga de la Excelencia

Una aplicación web educativa gamificada con temática de superhéroes para gestionar el rendimiento y comportamiento de estudiantes.

## 🚀 Características Principales

### 🎓 Dashboard de Administración (Profesores)
- **Gestión de Héroes**: Registro, edición y eliminación de estudiantes con perfiles de superhéroes
- **Sistema de Puntos**: Asignación rápida de puntos por méritos académicos y comportamiento
- **Biblioteca de Iconos**: Gestión de avatares y emojis para personalizar perfiles
- **Estadísticas en Tiempo Real**: Visualización de datos clave del sistema
- **Filtros Avanzados**: Búsqueda por nombre, curso y rango de puntos

### 🦸‍♂️ Interfaz para Alumnos
- **Perfil Personalizado**: Avatar, nombre de superhéroe, poder especial y emojis decorativos
- **Sistema de Medallas**: Reconocimientos basados en logros y rachas
- **Hall de la Fama**: Rankings semanal, mensual y general
- **Tienda de Recompensas**: Canje de puntos por privilegios y premios físicos
- **Historial de Misiones**: Registro de actividades completadas

## 🎨 Diseño Visual
- **Colores Temáticos**: Azul, rojo y amarillo inspirados en superhéroes clásicos
- **Animaciones Dinámicas**: Efectos visuales al ganar puntos y desbloquear logros
- **Diseño Responsivo**: Compatible con tablets, móviles y escritorio
- **Interfaz Intuitiva**: Navegación sencilla para profesores y estudiantes

## 🛠️ Tecnologías Utilizadas

### Frontend
- **HTML5**: Estructura semántica y accesible
- **CSS3**: Animaciones, efectos visuales y diseño responsive
- **JavaScript ES6+**: Lógica dinámica y gestión de estado
- **Bootstrap 5**: Framework CSS para diseño responsive
- **Font Awesome 6**: Biblioteca de iconos

### Almacenamiento de Datos
- **LocalStorage**: Base de datos local del navegador (implementación actual)
- **Opcional**: Firebase/Google Sheets para implementación en la nube

## 📁 Estructura del Proyecto

```
web superheroes/
├── index.html              # Página principal
├── css/
│   └── superheroes.css     # Estilos con temática de superhéroes
├── js/
│   └── superheroes.js      # Lógica principal de la aplicación
├── assets/                 # Imágenes y recursos adicionales
├── firebase-config.js      # Configuración de Firebase (opcional)
└── README.md              # Documentación del proyecto
```

## 🚀 Instalación y Uso

### 1. Clonar o descargar el proyecto
```bash
git clone [URL-del-repositorio]
cd "web superheroes"
```

### 2. Abrir la aplicación
Simplemente abre el archivo `index.html` en tu navegador web:

```bash
# Opción 1: Doble clic en index.html
# Opción 2: Servidor local (recomendado)
python -m http.server 8000
# Luego visita http://localhost:8000
```

### 3. Comenzar a usar
- La aplicación incluye datos de ejemplo para probar inmediatamente
- Los datos se guardan automáticamente en el navegador
- Usa el botón "Cambiar Vista" para alternar entre admin y estudiante

## 🎮 Funcionalidades Detalladas

### Gestión de Héroes
- **Registro**: Nombre real, nombre de superhéroe, curso, poder especial
- **Avatares**: 16 iconos de superhéroes disponibles (🦸, 🦹, 🐉, ⚡, etc.)
- **Emojis Decorativos**: Personalización con 16 emojis temáticos
- **Edición**: Modificación completa de perfiles existentes

### Sistema de Puntos
- **Asignación Masiva**: Seleccionar múltiples estudiantes simultáneamente
- **Motivos Personalizados**: Descripción detallada de cada asignación
- **Valores Predefinidos**: 5, 10, 15, 20, 25 puntos
- **Historial Completo**: Registro de todas las asignaciones con fecha

### Recompensas Canjeables
- **Recompensas Físicas**: Pegatinas (50 pts), lápices (75 pts), certificados (150 pts)
- **Privilegios Especiales**: Ayudante del profesor (100 pts), tiempo extra recreo (80 pts)
- **Validación Automática**: Verificación de puntos disponibles

### Rankings y Competencia
- **Múltiples Períodos**: Semanal, mensual y general
- **Posiciones Destacadas**: Top 3 con colores especiales (oro, plata, bronce)
- **Identificación Personal**: Resaltado del usuario actual en rankings

## 🔧 Personalización

### Agregar Nuevos Avatares
Edita el array `availableAvatars` en `js/superheroes.js`:
```javascript
let availableAvatars = ['🦸', '🦹', '🐉', '⚡', '🌪️', '🛡️', '🧙', '🧚', '🦸‍♀️', '🦹‍♀️', '🔥', '💫', '🌟', '💪', '🧠', '❤️'];
```

### Modificar Recompensas
Actualiza el array `rewards` con nuevos premios:
```javascript
let rewards = [
    { id: 1, name: 'Nombre de la recompensa', icon: '🎁', points: 100, type: 'physical' }
];
```

### Personalizar Colores
Modifica las variables CSS en `css/superheroes.css`:
```css
:root {
    --hero-blue: #0066CC;
    --hero-red: #DC143C;
    --hero-yellow: #FFD700;
}
```

## 🌐 Integración con Firebase (Opcional)

Para implementar sincronización en la nube:

1. **Crear proyecto Firebase**: https://console.firebase.google.com
2. **Configurar Firestore Database**: Base de datos NoSQL
3. **Agregar archivo de configuración**: `firebase-config.js`
4. **Modificar funciones de guardado**: Reemplazar LocalStorage por Firebase

## 📱 Compatibilidad

### Navegadores Soportados
- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

### Dispositivos
- ✅ Escritorio (Windows, Mac, Linux)
- ✅ Tablets (iPad, Android)
- ✅ Móviles (iOS, Android)

## 🎯 Objetivos Educativos

- **Motivación Intrínseca**: Gamificación del aprendizaje
- **Reconocimiento Positivo**: Refuerzo constante de logros
- **Desarrollo de Hábitos**: Sistema de rachas y consistencia
- **Trabajo en Equipo**: Competencia saludable y colaboración
- **Autoestima**: Perfiles personalizados y superpoderes

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Por favor:

1. Fork del proyecto
2. Crear rama de características (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 📞 Soporte

Para preguntas o sugerencias:
- 📧 Correo: [tu-correo@ejemplo.com]
- 🐛 Issues: [GitHub Issues del proyecto]

---

**¡Que la Fuerza del Aprendizaje te acompañe!** 🦸‍♀️⚡🦸‍♂️

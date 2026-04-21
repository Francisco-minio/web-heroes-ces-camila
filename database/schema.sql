-- Base de datos: superheroes
-- Estructura completa para la aplicación de Superhéroes

CREATE DATABASE IF NOT EXISTS superheroes 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE superheroes;

-- Tabla de Cursos
CREATE TABLE IF NOT EXISTS courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    level INT NOT NULL,
    section CHAR(1) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_level (level),
    INDEX idx_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Héroes (Alumnos)
CREATE TABLE IF NOT EXISTS heroes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    realName VARCHAR(100) NOT NULL,
    heroName VARCHAR(100) NOT NULL UNIQUE,
    course_id INT NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    specialPower VARCHAR(200),
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(50) DEFAULT '🦸',
    points INT DEFAULT 0,
    streak INT DEFAULT 0,
    emojis JSON,
    medals JSON,
    missions JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_points (points),
    INDEX idx_course (course_id),
    INDEX idx_course_code (course_code),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Historial de Puntos
CREATE TABLE IF NOT EXISTS points_history (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    hero_id BIGINT NOT NULL,
    points INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hero_id) REFERENCES heroes(id) ON DELETE CASCADE,
    INDEX idx_hero_date (hero_id, date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Medallas Personalizadas (por profesor)
CREATE TABLE IF NOT EXISTS custom_medals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    description TEXT,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de relación Héroes-Medallas (muchos a muchos)
CREATE TABLE IF NOT EXISTS hero_medals (
    hero_id BIGINT NOT NULL,
    medal_id BIGINT NOT NULL,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    awarded_by VARCHAR(50),
    PRIMARY KEY (hero_id, medal_id),
    FOREIGN KEY (hero_id) REFERENCES heroes(id) ON DELETE CASCADE,
    FOREIGN KEY (medal_id) REFERENCES custom_medals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar cursos por defecto
INSERT INTO courses (code, name, level, section, description) VALUES
('1A', '1° A', 1, 'A', 'Primer grado sección A'),
('1B', '1° B', 1, 'B', 'Primer grado sección B'),
('2A', '2° A', 2, 'A', 'Segundo grado sección A'),
('2B', '2° B', 2, 'B', 'Segundo grado sección B'),
('3A', '3° A', 3, 'A', 'Tercer grado sección A'),
('3B', '3° B', 3, 'B', 'Tercer grado sección B'),
('4A', '4° A', 4, 'A', 'Cuarto grado sección A'),
('4B', '4° B', 4, 'B', 'Cuarto grado sección B'),
('5A', '5° A', 5, 'A', 'Quinto grado sección A'),
('5B', '5° B', 5, 'B', 'Quinto grado sección B'),
('6A', '6° A', 6, 'A', 'Sexto grado sección A'),
('6B', '6° B', 6, 'B', 'Sexto grado sección B');

-- Datos de ejemplo (opcional, para pruebas)
-- INSERT INTO heroes (realName, heroName, course_id, course_code, specialPower, username, password, avatar, points, streak) 
-- VALUES ('Profesor Demo', 'SuperProfe', 1, '1A', 'Control total del aula', 'profesor', 'heroes2024', '👨‍🏫', 0, 0);

-- INSERT INTO heroes (realName, heroName, course_id, course_code, specialPower, username, password, avatar, points, streak) 
-- VALUES ('Alumno Demo', 'SuperAlumno', 1, '1A', 'Aprendizaje veloz', 'alumno', 'pass123', '🦸', 50, 3);

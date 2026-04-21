-- Script de base de datos para Vercel Postgres (PostgreSQL)

-- Tabla de Héroes
CREATE TABLE IF NOT EXISTS heroes (
    id SERIAL PRIMARY KEY,
    real_name VARCHAR(100) NOT NULL,
    hero_name VARCHAR(100) NOT NULL UNIQUE,
    course_code VARCHAR(20) NOT NULL,
    special_power VARCHAR(200),
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(50) DEFAULT '🦸',
    points INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    emojis JSONB DEFAULT '[]',
    medals JSONB DEFAULT '[]',
    missions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Historial de Puntos
CREATE TABLE IF NOT EXISTS points_history (
    id SERIAL PRIMARY KEY,
    hero_id INTEGER REFERENCES heroes(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    reason VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Medallas Personalizadas
CREATE TABLE IF NOT EXISTS custom_medals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    description TEXT,
    created_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Datos iniciales para que la app no esté vacía
INSERT INTO heroes (real_name, hero_name, course_code, username, password, avatar, points)
VALUES 
('Ana García', 'Thunder Girl', '1A', 'ana', 'pass123', '⚡', 120),
('Carlos López', 'Fire Boy', '1B', 'carlos', 'pass123', '🔥', 95),
('María Rodríguez', 'Star Princess', '2A', 'maria', 'pass123', '🌟', 150)
ON CONFLICT (username) DO NOTHING;

-- Estructura de Base de Datos para cPanel (MySQL)

CREATE TABLE IF NOT EXISTS `courses` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `level` varchar(50) DEFAULT 'Básico',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `heroes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `heroName` varchar(255) NOT NULL,
  `realName` varchar(255) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `password` varchar(100) DEFAULT NULL,
  `course` varchar(100) DEFAULT NULL,
  `superPower` varchar(255) DEFAULT NULL,
  `avatar` varchar(50) DEFAULT '🦸',
  `points` int(11) DEFAULT 0,
  `streak` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `points_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hero_id` int(11) NOT NULL,
  `points` int(11) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `date` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `hero_id` (`hero_id`),
  CONSTRAINT `points_history_ibfk_1` FOREIGN KEY (`hero_id`) REFERENCES `heroes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `system_config` (
  `id` int(11) NOT NULL DEFAULT 1,
  `cronAmount` int(11) DEFAULT 3,
  `cronHour` int(11) DEFAULT 5,
  `cronBonus` int(11) DEFAULT 3,
  `lastRun` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Medallas (Si usas una tabla aparte, de lo contrario se guardan en el historial)
CREATE TABLE IF NOT EXISTS `medals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `hero_id` int(11) NOT NULL,
  `medal_type` varchar(100) NOT NULL,
  `date_awarded` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`hero_id`) REFERENCES `heroes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- MySQL Database Schema for EPCS Reliability Report

-- Create pages table
CREATE TABLE IF NOT EXISTS pages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page_id VARCHAR(255) UNIQUE NOT NULL,
  page_number INT NOT NULL,
  page_type VARCHAR(50) NOT NULL,
  title VARCHAR(500),
  page_data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  updated_by VARCHAR(255) DEFAULT 'system',
  INDEX idx_page_number (page_number),
  INDEX idx_page_type (page_type),
  INDEX idx_page_id (page_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create page history table (for audit trail)
CREATE TABLE IF NOT EXISTS page_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page_id VARCHAR(255) NOT NULL,
  page_number INT NOT NULL,
  old_data JSON,
  new_data JSON,
  changed_by VARCHAR(255),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  change_description VARCHAR(500),
  FOREIGN KEY (page_id) REFERENCES pages(page_id),
  INDEX idx_page_id (page_id),
  INDEX idx_changed_at (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create users table (for future authentication)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  role VARCHAR(50) DEFAULT 'editor',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create files table (for future file storage integration)
CREATE TABLE IF NOT EXISTS files (
  id INT AUTO_INCREMENT PRIMARY KEY,
  page_id VARCHAR(255),
  file_type VARCHAR(50),
  file_name VARCHAR(255),
  file_url VARCHAR(500),
  file_size INT,
  storage_location VARCHAR(50),
  uploaded_by VARCHAR(255),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (page_id) REFERENCES pages(page_id),
  INDEX idx_page_id (page_id),
  INDEX idx_uploaded_at (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

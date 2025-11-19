CREATE DATABASE IF NOT EXISTS wa_bot
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE wa_bot;

DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS drivers;

CREATE TABLE requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  whatsapp_id VARCHAR(64),
  name VARCHAR(255),
  phone VARCHAR(64),
  pickup VARCHAR(255),
  drop_location VARCHAR(255),
  date_time VARCHAR(128),
  service_type VARCHAR(64),
  status ENUM('Pending','Assigned','Completed','Cancelled') DEFAULT 'Pending',
  assigned_to VARCHAR(255),
  raw_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_status ON requests(status);

CREATE TABLE drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(64) NOT NULL,
  vehicle VARCHAR(64),
  city VARCHAR(128),
  status ENUM('Available','Busy') DEFAULT 'Available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255),
  phone VARCHAR(50),
  vehicle VARCHAR(100),
  city VARCHAR(100),
  status ENUM('Available', 'On Trip', 'Offline') DEFAULT 'Available'
);

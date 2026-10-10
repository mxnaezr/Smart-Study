-- Smart Study / StudyFlow database schema
-- Target: MySQL 8.0+
-- Derived from JPA entities in studyflow-backend.
-- This creates schema only; it does not export existing user data.
-- Back up any existing database before applying changes.

CREATE DATABASE IF NOT EXISTS studyflow_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE studyflow_db;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  password VARCHAR(255) NOT NULL,
  gender VARCHAR(10),
  date_of_birth DATE,
  phone_number VARCHAR(30),
  profile_image VARCHAR(500),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  verification_code VARCHAR(6),
  verification_code_expiry DATETIME(6),
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_users_email UNIQUE (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS subjects (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(500),
  color VARCHAR(50),
  user_id BIGINT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_subjects_user_id (user_id),
  CONSTRAINT fk_subjects_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS study_sessions (
  id BIGINT NOT NULL AUTO_INCREMENT,
  start_time DATETIME(6) NOT NULL,
  end_time DATETIME(6),
  duration_minutes INT NOT NULL DEFAULT 0,
  notes TEXT,
  user_id BIGINT NOT NULL,
  subject_id BIGINT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_study_sessions_user_id (user_id),
  KEY idx_study_sessions_subject_id (subject_id),
  KEY idx_study_sessions_start_time (start_time),
  CONSTRAINT fk_study_sessions_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_study_sessions_subject FOREIGN KEY (subject_id)
    REFERENCES subjects(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS study_goals (
  id BIGINT NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  target_minutes INT NOT NULL,
  current_minutes INT NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  user_id BIGINT NOT NULL,
  subject_id BIGINT,
  PRIMARY KEY (id),
  KEY idx_study_goals_user_id (user_id),
  KEY idx_study_goals_subject_id (subject_id),
  CONSTRAINT fk_study_goals_user FOREIGN KEY (user_id)
    REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_study_goals_subject FOREIGN KEY (subject_id)
    REFERENCES subjects(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS friendships (
  id BIGINT NOT NULL AUTO_INCREMENT,
  requester_id BIGINT NOT NULL,
  addressee_id BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT uk_friendship_pair UNIQUE (requester_id, addressee_id),
  KEY idx_friendships_addressee_id (addressee_id),
  CONSTRAINT chk_friendships_status CHECK (status IN ('PENDING','ACCEPTED','DECLINED')),
  CONSTRAINT fk_friendships_requester FOREIGN KEY (requester_id) REFERENCES users(id),
  CONSTRAINT fk_friendships_addressee FOREIGN KEY (addressee_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS study_call_logs (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  room_code VARCHAR(80) NOT NULL,
  joined_at DATETIME(6) NOT NULL,
  left_at DATETIME(6),
  duration_seconds BIGINT,
  call_type VARCHAR(20) NOT NULL DEFAULT 'GROUP',
  PRIMARY KEY (id),
  KEY idx_study_call_logs_user_id (user_id),
  KEY idx_study_call_logs_room_code (room_code),
  CONSTRAINT fk_study_call_logs_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS email_verifications (
  id BIGINT NOT NULL AUTO_INCREMENT,
  email VARCHAR(150) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (id),
  KEY idx_email_verifications_email (email),
  KEY idx_email_verifications_expires_at (expires_at)
) ENGINE=InnoDB;

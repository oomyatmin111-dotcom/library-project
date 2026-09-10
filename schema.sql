-- =====================================================
-- Library Management System Database Schema
-- Database: MySQL 8.0+
-- =====================================================

CREATE DATABASE IF NOT EXISTS `library_db`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `library_db`;

-- -----------------------------------------------------
-- 1. Roles Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `roles` (
    `role_id` INT AUTO_INCREMENT PRIMARY KEY,
    `role_name` VARCHAR(50) NOT NULL UNIQUE,
    `description` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Default Roles
INSERT IGNORE INTO `roles` (`role_name`, `description`) VALUES 
('ADMIN', 'System Administrator with full access'),
('LIBRARIAN', 'Library staff managing books and loans'),
('MEMBER', 'General member who can borrow books');

-- -----------------------------------------------------
-- 2. Users / Members Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `user_id` INT AUTO_INCREMENT PRIMARY KEY,
    `role_id` INT NOT NULL,
    `membership_no` VARCHAR(30) NOT NULL UNIQUE,
    `first_name` VARCHAR(50) NOT NULL,
    `last_name` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `refresh_token_hash` VARCHAR(255) NULL,
    `phone` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `status` ENUM('ACTIVE', 'SUSPENDED', 'EXPIRED') DEFAULT 'ACTIVE',
    `max_borrow_limit` INT DEFAULT 5,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`role_id`) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- 3. Categories / Genres Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
    `category_id` INT AUTO_INCREMENT PRIMARY KEY,
    `category_name` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- 4. Authors Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `authors` (
    `author_id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `biography` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- 5. Publishers Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `publishers` (
    `publisher_id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `address` TEXT NULL,
    `phone` VARCHAR(20) NULL,
    `email` VARCHAR(100) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- 6. Books Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `books` (
    `book_id` INT AUTO_INCREMENT PRIMARY KEY,
    `isbn` VARCHAR(20) NOT NULL UNIQUE,
    `title` VARCHAR(255) NOT NULL,
    `category_id` INT NULL,
    `publisher_id` INT NULL,
    `publication_year` INT NULL,
    `edition` VARCHAR(50) NULL,
    `language` VARCHAR(50) DEFAULT 'English',
    `shelf_location` VARCHAR(50) NULL,
    `total_copies` INT DEFAULT 0,
    `available_copies` INT DEFAULT 0,
    `description` TEXT NULL,
    `cover_image` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_books_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`category_id`) ON DELETE SET NULL,
    CONSTRAINT `fk_books_publisher` FOREIGN KEY (`publisher_id`) REFERENCES `publishers` (`publisher_id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- 7. Book Authors Table (Many-to-Many Relationship)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `book_authors` (
    `book_id` INT NOT NULL,
    `author_id` INT NOT NULL,
    PRIMARY KEY (`book_id`, `author_id`),
    CONSTRAINT `fk_ba_book` FOREIGN KEY (`book_id`) REFERENCES `books` (`book_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_ba_author` FOREIGN KEY (`author_id`) REFERENCES `authors` (`author_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- 8. Book Copies Table (Individual Physical Copies)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `book_copies` (
    `copy_id` INT AUTO_INCREMENT PRIMARY KEY,
    `book_id` INT NOT NULL,
    `barcode` VARCHAR(50) NOT NULL UNIQUE,
    `status` ENUM('AVAILABLE', 'BORROWED', 'RESERVED', 'LOST', 'DAMAGED') DEFAULT 'AVAILABLE',
    `condition_note` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_copies_book` FOREIGN KEY (`book_id`) REFERENCES `books` (`book_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- 9. Borrowings / Loans Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `borrowings` (
    `borrowing_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `copy_id` INT NOT NULL,
    `librarian_id` INT NULL,
    `borrow_date` DATE NOT NULL,
    `due_date` DATE NOT NULL,
    `return_date` DATE NULL,
    `status` ENUM('BORROWED', 'RETURNED', 'OVERDUE', 'LOST') DEFAULT 'BORROWED',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_borrowings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_borrowings_copy` FOREIGN KEY (`copy_id`) REFERENCES `book_copies` (`copy_id`) ON DELETE RESTRICT,
    CONSTRAINT `fk_borrowings_librarian` FOREIGN KEY (`librarian_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- 10. Fines Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `fines` (
    `fine_id` INT AUTO_INCREMENT PRIMARY KEY,
    `borrowing_id` INT NOT NULL UNIQUE,
    `amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `paid_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `payment_status` ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID', 'WAIVED') DEFAULT 'UNPAID',
    `payment_date` TIMESTAMP NULL,
    `notes` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_fines_borrowing` FOREIGN KEY (`borrowing_id`) REFERENCES `borrowings` (`borrowing_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- 11. Reservations Table
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `reservations` (
    `reservation_id` INT AUTO_INCREMENT PRIMARY KEY,
    `book_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `reservation_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `status` ENUM('PENDING', 'FULFILLED', 'CANCELLED', 'EXPIRED') DEFAULT 'PENDING',
    CONSTRAINT `fk_reservations_book` FOREIGN KEY (`book_id`) REFERENCES `books` (`book_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_reservations_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- 12. User Favorites / Bookmarks Table (Phase 2)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS `user_favorites` (
    `favorite_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `comic_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_user_favorite` (`user_id`, `comic_id`),
    CONSTRAINT `fk_fav_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE,
    CONSTRAINT `fk_fav_comic` FOREIGN KEY (`comic_id`) REFERENCES `comics` (`comic_id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------
-- Indexes for Performance
-- -----------------------------------------------------
CREATE INDEX `idx_books_isbn` ON `books` (`isbn`);
CREATE INDEX `idx_books_title` ON `books` (`title`);
CREATE INDEX `idx_book_copies_barcode` ON `book_copies` (`barcode`);
CREATE INDEX `idx_borrowings_status` ON `borrowings` (`status`);
CREATE INDEX `idx_borrowings_due_date` ON `borrowings` (`due_date`);
CREATE INDEX `idx_users_membership` ON `users` (`membership_no`);

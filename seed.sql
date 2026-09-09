-- =====================================================
-- Sample Seed Data for Library Management System
-- =====================================================

USE `library_db`;

-- 1. Users (Sample Admin & Members)
INSERT INTO `users` (`role_id`, `membership_no`, `first_name`, `last_name`, `email`, `password_hash`, `phone`, `address`) VALUES
(1, 'ADM001', 'Super', 'Admin', 'admin@library.com', '$2y$10$SampleHashForAdminPassword123', '0912345678', 'Yangon, Myanmar'),
(2, 'LIB001', 'Aung', 'Kyaw', 'aungkyaw@library.com', '$2y$10$SampleHashForLibrarian123', '0923456789', 'Mandalay, Myanmar'),
(3, 'MEM001', 'Hla', 'Hla', 'hlahla@gmail.com', '$2y$10$SampleHashForMember123', '0934567890', 'Yangon, Myanmar'),
(3, 'MEM002', 'Kyaw', 'Zin', 'kyawzin@gmail.com', '$2y$10$SampleHashForMember456', '0945678901', 'Naypyidaw, Myanmar');

-- 2. Categories
INSERT INTO `categories` (`category_name`, `description`) VALUES
('Computer Science', 'Programming, Algorithms, Web Development and AI books'),
('Fiction', 'Novels, Short stories, and literature'),
('History', 'World history, Myanmar history, and historical research'),
('Science', 'Physics, Chemistry, Biology and general science');

-- 3. Authors
INSERT INTO `authors` (`name`, `biography`) VALUES
('Robert C. Martin', 'Software engineer and author of Clean Code and Clean Architecture'),
('George Orwell', 'English novelist, essayist, journalist, and critic'),
('Martin Fowler', 'Software developer and author specializing in object-oriented analysis and design'),
('Thakin Ba Thaung', 'Renowned Myanmar author and historian');

-- 4. Publishers
INSERT INTO `publishers` (`name`, `address`, `phone`, `email`) VALUES
('Prentice Hall', 'Upper Saddle River, NJ, USA', '+1-800-922-0579', 'info@prenhall.com'),
('Secker & Warburg', 'London, UK', '+44-20-7840-8400', 'contact@secker.co.uk'),
('Addison-Wesley', 'Boston, MA, USA', '+1-617-848-6000', 'contact@aw.com'),
('Sarpay Beikman', 'Yangon, Myanmar', '01-240051', 'info@sarpaybeikman.gov.mm');

-- 5. Books
INSERT INTO `books` (`isbn`, `title`, `category_id`, `publisher_id`, `publication_year`, `edition`, `language`, `shelf_location`, `total_copies`, `available_copies`, `description`) VALUES
('978-0132350884', 'Clean Code: A Handbook of Agile Software Craftsmanship', 1, 1, 2008, '1st', 'English', 'Shelf-A1', 3, 2, 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees.'),
('978-0451524935', '1984', 2, 2, 1949, 'Reprint', 'English', 'Shelf-B3', 2, 2, 'A dystopian social science fiction novel and cautionary tale.'),
('978-0201485677', 'Refactoring: Improving the Design of Existing Code', 1, 3, 1999, '1st', 'English', 'Shelf-A1', 2, 1, 'Guides programmers through refactoring techniques.');

-- 6. Book Authors mapping
INSERT INTO `book_authors` (`book_id`, `author_id`) VALUES
(1, 1),
(2, 2),
(3, 3);

-- 7. Book Copies (Barcodes)
INSERT INTO `book_copies` (`book_id`, `barcode`, `status`, `condition_note`) VALUES
(1, 'BC-CC-001', 'BORROWED', 'Good condition'),
(1, 'BC-CC-002', 'AVAILABLE', 'New copy'),
(1, 'BC-CC-003', 'AVAILABLE', 'Good condition'),
(2, 'BC-1984-001', 'AVAILABLE', 'Good condition'),
(2, 'BC-1984-002', 'AVAILABLE', 'Slightly worn cover'),
(3, 'BC-REF-001', 'BORROWED', 'Good condition'),
(3, 'BC-REF-002', 'AVAILABLE', 'New copy');

-- 8. Borrowing Transactions
INSERT INTO `borrowings` (`user_id`, `copy_id`, `librarian_id`, `borrow_date`, `due_date`, `return_date`, `status`) VALUES
(3, 1, 2, '2026-08-20', '2026-09-03', '2026-09-02', 'RETURNED'),
(3, 1, 2, '2026-09-05', '2026-09-19', NULL, 'BORROWED'),
(4, 6, 2, '2026-08-10', '2026-08-24', NULL, 'OVERDUE');

-- 9. Fines (For overdue loan)
INSERT INTO `fines` (`borrowing_id`, `amount`, `paid_amount`, `payment_status`, `notes`) VALUES
(3, 5000.00, 0.00, 'UNPAID', 'Overdue fine for book BC-REF-001');

-- 10. Reservations
INSERT INTO `reservations` (`book_id`, `user_id`, `status`) VALUES
(3, 3, 'PENDING');

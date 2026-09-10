import pymysql

conn = pymysql.connect(
    host='localhost',
    user='root',
    password='Password@123',
    database='library_db'
)
cur = conn.cursor()

# Create reviews table
cur.execute("
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    comic_id INT NULL,
    book_id INT NULL,
    rating INT NOT NULL,
    review_title VARCHAR(255) NULL,
    review_text TEXT NOT NULL,
    has_spoilers BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_comic FOREIGN KEY (comic_id) REFERENCES comics (comic_id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_book FOREIGN KEY (book_id) REFERENCES books (book_id) ON DELETE CASCADE
) ENGINE=InnoDB;
")

# Insert sample review
cur.execute("
INSERT INTO reviews (user_id, comic_id, rating, review_title, review_text, has_spoilers)
SELECT 3, 1, 5, 'Masterpiece of modern comics!', 'Absolute must-read. The artwork and storyline in Batman: Hush set the benchmark for Gotham lore.', FALSE
WHERE NOT EXISTS (SELECT 1 FROM reviews WHERE user_id = 3 AND comic_id = 1);
")

conn.commit()
print(Phase 4 & 5 DB setup finished successfully!)

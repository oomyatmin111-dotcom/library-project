import pymysql

def run():
    conn = pymysql.connect(
        host='127.0.0.1',
        port=3306,
        user='root',
        password='Password@123',
        database='library_db',
        autocommit=True
    )
    cursor = conn.cursor()

    print("Running Phase 2 Database Setup...")

    # 1. Add refresh_token_hash column to users if not exists
    cursor.execute("""
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'library_db' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'refresh_token_hash';
    """)
    if not cursor.fetchone():
        cursor.execute("ALTER TABLE users ADD COLUMN refresh_token_hash VARCHAR(255) NULL AFTER password_hash;")
        print("Added refresh_token_hash column to users table.")
    else:
        print("refresh_token_hash column already exists.")

    # 2. Create user_favorites table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_favorites (
            favorite_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            comic_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uk_user_favorite (user_id, comic_id),
            CONSTRAINT fk_fav_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
            CONSTRAINT fk_fav_comic FOREIGN KEY (comic_id) REFERENCES comics (comic_id) ON DELETE CASCADE
        ) ENGINE=InnoDB;
    """)
    print("user_favorites table ready.")

    # 3. Update existing user passwords to genuine bcrypt hashes of 'Password@123'
    hashed = '$2b$10$IDen8dCKnwt5BUHTI1oTGupG2MLnJU5uAVKD/4PLirzYIl4GXPVMC'
    cursor.execute("UPDATE users SET password_hash = %s WHERE password_hash LIKE %s;", (hashed, '%SampleHash%'))
    print(f"Updated sample user passwords. Rows affected: {cursor.rowcount}")

    # 4. Seed sample favorites for user_id 3 (Hla Hla)
    sample_favorites = [(3, 1), (3, 2), (3, 6)]
    cursor.executemany("""
        INSERT IGNORE INTO user_favorites (user_id, comic_id) VALUES (%s, %s);
    """, sample_favorites)
    print("Sample favorites seeded.")

    print("Phase 2 Database Setup completed successfully!")
    conn.close()

if __name__ == '__main__':
    run()

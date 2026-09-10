import pymysql

conn = pymysql.connect(
    host='localhost',
    user='root',
    password='Password@123',
    database='library_db'
)
cur = conn.cursor()

# 1. Add membership_tier to users
try:
    cur.execute("""
        ALTER TABLE users 
        ADD COLUMN membership_tier ENUM('FREE', 'GOLD_VIP', 'PLATINUM_VIP') DEFAULT 'FREE';
    """)
    print("Added membership_tier to users")
except Exception as e:
    print("membership_tier column might already exist:", e)

# 2. Create wallets table
cur.execute("""
CREATE TABLE IF NOT EXISTS wallets (
    wallet_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    coins_balance INT NOT NULL DEFAULT 100,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
""")

# 3. Create wallet_transactions table
cur.execute("""
CREATE TABLE IF NOT EXISTS wallet_transactions (
    tx_id INT AUTO_INCREMENT PRIMARY KEY,
    wallet_id INT NOT NULL,
    amount INT NOT NULL,
    type ENUM('CREDIT', 'DEBIT') NOT NULL,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (wallet_id) REFERENCES wallets(wallet_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
""")

# 4. Create audit_logs table
cur.execute("""
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    details TEXT NOT NULL,
    ip_address VARCHAR(45) DEFAULT '127.0.0.1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
""")

# 5. Populate wallets for existing users
cur.execute("SELECT user_id, email FROM users;")
users = cur.fetchall()
for u_id, email in users:
    coins = 500 if 'admin' in email else 250
    tier = 'PLATINUM_VIP' if 'admin' in email else 'GOLD_VIP'
    cur.execute("UPDATE users SET membership_tier = %s WHERE user_id = %s;", (tier, u_id))
    cur.execute("""
        INSERT INTO wallets (user_id, coins_balance)
        VALUES (%s, %s)
        ON DUPLICATE KEY UPDATE coins_balance = %s;
    """, (u_id, coins, coins))

# 6. Seed sample audit logs
cur.execute("SELECT COUNT(*) FROM audit_logs;")
if cur.fetchone()[0] == 0:
    cur.execute("""
        INSERT INTO audit_logs (user_id, action, entity_type, details)
        VALUES
        (1, 'CIRCULATION_CHECKOUT', 'BOOK_COPY', 'Issued book copy BC-CC-001 to member Hla Hla (MEM001)'),
        (1, 'FINE_WAIVED', 'FINE', 'Waived overdue fine of $5.00 for borrowing #3 (Medical exception)'),
        (1, 'INGEST_CHAPTER', 'COMIC_ISSUE', 'Ingested 4 pages for Chapter 2: The Return via Bulk Uploader'),
        (2, 'VIP_UPGRADE', 'MEMBERSHIP', 'Upgraded subscription tier to GOLD_VIP with welcome bonus');
    """)

conn.commit()
print("Phase 10 database schema, wallets, and audit logs initialized!")
conn.close()

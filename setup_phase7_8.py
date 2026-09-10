import pymysql

conn = pymysql.connect(
    host='localhost',
    user='root',
    password='Password@123',
    database='library_db'
)
cur = conn.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS annotations (
    annotation_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    issue_id INT NOT NULL,
    page_number INT NOT NULL,
    note TEXT NOT NULL,
    color VARCHAR(20) DEFAULT '#f59e0b',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (issue_id) REFERENCES issues(issue_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
""")

cur.execute("""
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('LOAN_DUE', 'RESERVATION_READY', 'NEW_ISSUE', 'SYSTEM') DEFAULT 'SYSTEM',
    is_read BOOLEAN DEFAULT FALSE,
    link_url VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
""")

cur.execute("SELECT COUNT(*) FROM notifications;")
if cur.fetchone()[0] == 0:
    cur.execute("""
        INSERT INTO notifications (user_id, title, message, type, is_read, link_url)
        VALUES
        (2, 'စာအုပ်ပြန်အပ်ရန် သတိပေးချက်', 'Loan Reminder: Clean Code is due in 2 days. Please return or renew in time.', 'LOAN_DUE', FALSE, '/circulation'),
        (2, 'အခန်းသစ် ထွက်ရှိပါပြီ!', 'New Chapter Alert: Solo Leveling Chapter 2 is now available to read online!', 'NEW_ISSUE', FALSE, '/comics/1/read/2'),
        (2, 'ကြိုတင်စာရင်းသွင်းမှု အဆင်သင့်ဖြစ်ပါပြီ', 'Reservation Ready: Your reserved book Domain-Driven Design is available at circulation desk.', 'RESERVATION_READY', TRUE, '/circulation');
    """)

# Insert sample annotation for issue 1 page 3
cur.execute("SELECT COUNT(*) FROM annotations;")
if cur.fetchone()[0] == 0:
    cur.execute("""
        INSERT INTO annotations (user_id, issue_id, page_number, note, color)
        VALUES (2, 1, 2, 'Epic entrance scene of the protagonist!', '#3b82f6');
    """)

conn.commit()
print("Phase 7 & 8 tables and seeds successfully created!")
conn.close()

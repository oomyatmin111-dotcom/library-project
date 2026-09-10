import pymysql

conn = pymysql.connect(
    host='localhost',
    user='root',
    password='Password@123',
    database='library_db'
)
cur = conn.cursor()

# 1. Add transcript column to issue_pages
try:
    cur.execute("ALTER TABLE issue_pages ADD COLUMN transcript TEXT NULL;")
    print("Added transcript column to issue_pages")
except Exception as e:
    print("Column transcript might already exist:", e)

# 2. Create ai_conversations table
cur.execute("""
CREATE TABLE IF NOT EXISTS ai_conversations (
    conversation_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    context_type VARCHAR(50) DEFAULT 'LORE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
""")

# 3. Seed sample page transcripts for speech bubble dialogue search
dialogues = [
    (1, 1, "Batman surveys Gotham from the shadows. 'This city needs a protector, but the darkness runs deep.'"),
    (1, 2, "Detective Gordon: 'Who are you in the cowl?' Batman replies: 'I am vengeance. I am the night.'"),
    (1, 3, "Catwoman leaps from the rooftop: 'Careful, handsome, cats have nine lives!'"),
    (2, 1, "Peter Parker swings through Manhattan: 'With great power comes great responsibility!'"),
    (2, 2, "Green Goblin cackles wildly: 'Spider-Man! Your heroics will be your downfall!'"),
    (2, 3, "Miles Morales: 'Everyone keeps telling me how my story is supposed to go. Nah, I\\'mma do my own thing.'"),
]

for issue_id, page_num, text in dialogues:
    cur.execute("""
        UPDATE issue_pages 
        SET transcript = %s 
        WHERE issue_id = %s AND page_number = %s
    """, (text, issue_id, page_num))

conn.commit()
print("Phase 9 database updates and dialogue transcripts initialized!")
conn.close()

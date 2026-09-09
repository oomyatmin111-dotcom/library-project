import os
import pymysql

# Database connection details
DB_HOST = '127.0.0.1'
DB_PORT = 3306
DB_USER = 'root'
DB_PASSWORD = 'Password@123'

def execute_sql_file(cursor, filepath):
    print(f"Reading {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    # Split by statements
    statements = []
    current_stmt = []
    
    for line in sql_content.splitlines():
        trimmed = line.strip()
        if trimmed.startswith('--') or not trimmed:
            continue
        current_stmt.append(line)
        if trimmed.endswith(';'):
            statements.append('\n'.join(current_stmt))
            current_stmt = []
            
    for stmt in statements:
        stmt_clean = stmt.strip()
        if stmt_clean:
            cursor.execute(stmt_clean)
    print(f"Successfully executed {len(statements)} statements from {filepath}.")

def main():
    print(f"Connecting to MySQL server at {DB_HOST}:{DB_PORT} as {DB_USER}...")
    try:
        conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            autocommit=True
        )
        print("Connected successfully!")
        
        with conn.cursor() as cursor:
            # 1. Execute schema.sql
            execute_sql_file(cursor, 'c:/repos/library-project/schema.sql')
            
            # 2. Execute seed.sql
            execute_sql_file(cursor, 'c:/repos/library-project/seed.sql')
            
            # 3. Check created tables
            cursor.execute("USE library_db;")
            cursor.execute("SHOW TABLES;")
            tables = cursor.fetchall()
            print("\nCreated Tables in 'library_db':")
            for t in tables:
                cursor.execute(f"SELECT COUNT(*) FROM `{t[0]}`;")
                count = cursor.fetchone()[0]
                print(f" - {t[0]}: {count} records")
                
        conn.close()
        print("\nDatabase setup completed successfully!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    main()

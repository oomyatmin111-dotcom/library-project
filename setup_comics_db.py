import pymysql

def run():
    conn = pymysql.connect(
        host='127.0.0.1',
        port=3306,
        user='root',
        password='Password@123',
        db='library_db',
        autocommit=True
    )
    cursor = conn.cursor()

    # 1. Create tables
    tables = [
        """CREATE TABLE IF NOT EXISTS universes (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            slug VARCHAR(100) NOT NULL UNIQUE,
            description TEXT NULL,
            logo_url VARCHAR(500) NULL,
            banner_url VARCHAR(500) NULL,
            accent_color VARCHAR(20) DEFAULT '#0476F2',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;""",

        """CREATE TABLE IF NOT EXISTS comics (
            comic_id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL UNIQUE,
            universe_id INT NULL,
            creator VARCHAR(255) NULL,
            description TEXT NULL,
            cover_image VARCHAR(500) NOT NULL,
            banner_image VARCHAR(500) NULL,
            release_year INT NULL,
            rating DECIMAL(3,2) DEFAULT 4.80,
            views_count INT DEFAULT 0,
            is_popular BOOLEAN DEFAULT TRUE,
            is_trending BOOLEAN DEFAULT FALSE,
            is_featured BOOLEAN DEFAULT FALSE,
            type ENUM('COMIC', 'EBOOK') DEFAULT 'COMIC',
            status ENUM('ONGOING', 'COMPLETED') DEFAULT 'ONGOING',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_comics_universe FOREIGN KEY (universe_id) REFERENCES universes (id) ON DELETE SET NULL
        ) ENGINE=InnoDB;""",

        """CREATE TABLE IF NOT EXISTS comic_category_map (
            comic_id INT NOT NULL,
            category_id INT NOT NULL,
            PRIMARY KEY (comic_id, category_id),
            CONSTRAINT fk_ccm_comic FOREIGN KEY (comic_id) REFERENCES comics (comic_id) ON DELETE CASCADE,
            CONSTRAINT fk_ccm_category FOREIGN KEY (category_id) REFERENCES categories (category_id) ON DELETE CASCADE
        ) ENGINE=InnoDB;""",

        """CREATE TABLE IF NOT EXISTS issues (
            issue_id INT AUTO_INCREMENT PRIMARY KEY,
            comic_id INT NOT NULL,
            issue_number INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            cover_image VARCHAR(500) NULL,
            total_pages INT DEFAULT 1,
            file_url VARCHAR(500) NULL,
            release_date DATE NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_issues_comic FOREIGN KEY (comic_id) REFERENCES comics (comic_id) ON DELETE CASCADE
        ) ENGINE=InnoDB;""",

        """CREATE TABLE IF NOT EXISTS issue_pages (
            page_id INT AUTO_INCREMENT PRIMARY KEY,
            issue_id INT NOT NULL,
            page_number INT NOT NULL,
            image_url VARCHAR(500) NOT NULL,
            CONSTRAINT fk_pages_issue FOREIGN KEY (issue_id) REFERENCES issues (issue_id) ON DELETE CASCADE
        ) ENGINE=InnoDB;""",

        """CREATE TABLE IF NOT EXISTS reading_progress (
            progress_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            comic_id INT NOT NULL,
            last_issue_id INT NOT NULL,
            last_page_number INT DEFAULT 1,
            progress_percent INT DEFAULT 0,
            is_completed BOOLEAN DEFAULT FALSE,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uk_user_comic (user_id, comic_id),
            CONSTRAINT fk_rp_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
            CONSTRAINT fk_rp_comic FOREIGN KEY (comic_id) REFERENCES comics (comic_id) ON DELETE CASCADE,
            CONSTRAINT fk_rp_issue FOREIGN KEY (last_issue_id) REFERENCES issues (issue_id) ON DELETE CASCADE
        ) ENGINE=InnoDB;""",

        """CREATE TABLE IF NOT EXISTS reading_history (
            history_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            comic_id INT NOT NULL,
            last_issue_id INT NULL,
            read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            CONSTRAINT fk_rh_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
            CONSTRAINT fk_rh_comic FOREIGN KEY (comic_id) REFERENCES comics (comic_id) ON DELETE CASCADE
        ) ENGINE=InnoDB;"""
    ]

    for stmt in tables:
        cursor.execute(stmt)
    print("Comic tables created successfully!")

    # 2. Insert Universes
    cursor.execute("""
    INSERT IGNORE INTO universes (id, name, slug, description, logo_url, banner_url, accent_color) VALUES
    (1, 'DC Comics', 'dc', 'Home of Batman, Superman, Wonder Woman and the Justice League.', 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=300', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200', '#0476F2'),
    (2, 'Marvel Comics', 'marvel', 'The Marvel Cinematic and Comic Universe featuring Spider-Man, Iron Man and Avengers.', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300', 'https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=1200', '#ED1D24'),
    (3, 'Dark Horse & Indie', 'indie', 'Hellboy, The Umbrella Academy, and iconic independent graphic novels.', 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300', 'https://images.unsplash.com/photo-1563089145-599997674d42?w=1200', '#10B981'),
    (4, 'E-Books & Sci-Fi', 'ebooks', 'Digital science fiction novels, lore encyclopedias, and graphic narratives.', 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=1200', '#8B5CF6')
    ON DUPLICATE KEY UPDATE name=VALUES(name);
    """)

    # 3. Seed Sample Comics
    cursor.execute("""
    INSERT IGNORE INTO comics (comic_id, title, slug, universe_id, creator, description, cover_image, banner_image, release_year, rating, views_count, is_popular, is_trending, is_featured, type, status) VALUES
    (1, 'Batman: Year One', 'batman-year-one', 1, 'Frank Miller & David Mazzucchelli', 'A wealthy playboy returns to a corrupt Gotham City, determined to wage a one-man war on crime as the masked vigilante Batman.', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=80', 1987, 4.95, 14200, 1, 1, 1, 'COMIC', 'COMPLETED'),
    (2, 'The Amazing Spider-Man: Multiverse Rift', 'spider-man-multiverse-rift', 2, 'Stan Lee & Steve Ditko', 'Peter Parker teams up across alternate dimensions to fight an existential threat targeting every spider-hero in existence.', 'https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=1600&auto=format&fit=crop&q=80', 2021, 4.90, 21500, 1, 1, 1, 'COMIC', 'ONGOING'),
    (3, 'Superman: For All Seasons', 'superman-for-all-seasons', 1, 'Jeph Loeb & Tim Sale', 'A coming-of-age story of Clark Kent leaving Smallville to embrace his destiny as Metropolis legendary guardian.', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1600&auto=format&fit=crop&q=80', 1998, 4.85, 9800, 1, 0, 0, 'COMIC', 'COMPLETED'),
    (4, 'Iron Man: Extremis Protocol', 'iron-man-extremis', 2, 'Warren Ellis & Adi Granov', 'Tony Stark reinvents the Iron Man armor using bio-technological enhancements to confront a deadly new domestic weapon.', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1600&auto=format&fit=crop&q=80', 2005, 4.80, 16300, 1, 1, 0, 'COMIC', 'COMPLETED'),
    (5, 'The Flash: Flashpoint Paradox', 'flash-flashpoint-paradox', 1, 'Geoff Johns & Andy Kubert', 'Barry Allen wakes up in an altered timeline where the Justice League does not exist and Atlantis is at war with Themyscira.', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1600&auto=format&fit=crop&q=80', 2011, 4.88, 12400, 1, 0, 0, 'COMIC', 'COMPLETED'),
    (6, 'Avengers: Infinity Gauntlet War', 'avengers-infinity-war', 2, 'Jim Starlin & George Perez', 'Thanos acquires all six Infinity Gems, reshaping reality itself while Earths Mightiest Heroes make their desperate final stand.', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1600&auto=format&fit=crop&q=80', 1991, 4.92, 28900, 1, 1, 1, 'COMIC', 'COMPLETED'),
    (7, 'Chronicles of the Multiverse (E-Book Edition)', 'chronicles-of-multiverse-ebook', 4, 'H.G. Wells & Modern Contributors', 'An anthology exploring parallel timelines, cosmic threats, and the science of quantum dimensional travel.', 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600&auto=format&fit=crop&q=80', 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=1600&auto=format&fit=crop&q=80', 2023, 4.75, 5400, 0, 1, 0, 'EBOOK', 'COMPLETED')
    ON DUPLICATE KEY UPDATE title=VALUES(title);
    """)

    # 4. Seed Sample Issues
    cursor.execute("""
    INSERT IGNORE INTO issues (issue_id, comic_id, issue_number, title, cover_image, total_pages, release_date) VALUES
    (1, 1, 1, 'Batman: Year One #1 - Chapter 1: Who I Am', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600', 8, '1987-02-01'),
    (2, 1, 2, 'Batman: Year One #2 - Chapter 2: The Bat in the Belfry', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600', 8, '1987-03-01'),
    (3, 2, 1, 'The Amazing Spider-Man #1 - Spider-Verse Awakening', 'https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=600', 10, '2021-05-15'),
    (4, 4, 1, 'Iron Man: Extremis #1 - Genesis of Iron', 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600', 6, '2005-01-01'),
    (5, 7, 1, 'Chronicles of the Multiverse - Volume 1: Origins', 'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?w=600', 12, '2023-08-10')
    ON DUPLICATE KEY UPDATE title=VALUES(title);
    """)

    # 5. Seed Pages
    comic_images_batch = [
        # Issue 1 (Batman)
        (1, 1, 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1000&auto=format&fit=crop&q=80'),
        (1, 2, 'https://images.unsplash.com/photo-1531259683007-016a7b628fc3?w=1000&auto=format&fit=crop&q=80'),
        (1, 3, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000&auto=format&fit=crop&q=80'),
        (1, 4, 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1000&auto=format&fit=crop&q=80'),
        (1, 5, 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1000&auto=format&fit=crop&q=80'),
        (1, 6, 'https://images.unsplash.com/photo-1563089145-599997674d42?w=1000&auto=format&fit=crop&q=80'),
        (1, 7, 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1000&auto=format&fit=crop&q=80'),
        (1, 8, 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1000&auto=format&fit=crop&q=80'),
        
        # Issue 3 (Spider-Man)
        (3, 1, 'https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=1000&auto=format&fit=crop&q=80'),
        (3, 2, 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1000&auto=format&fit=crop&q=80'),
        (3, 3, 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1000&auto=format&fit=crop&q=80'),
        (3, 4, 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1000&auto=format&fit=crop&q=80'),
        (3, 5, 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=1000&auto=format&fit=crop&q=80'),
        (3, 6, 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1000&auto=format&fit=crop&q=80'),
        (3, 7, 'https://images.unsplash.com/photo-1635863138275-d9b33299680b?w=1000&auto=format&fit=crop&q=80'),
        (3, 8, 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1000&auto=format&fit=crop&q=80'),
        (3, 9, 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=1000&auto=format&fit=crop&q=80'),
        (3, 10, 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1000&auto=format&fit=crop&q=80')
    ]

    cursor.execute('DELETE FROM issue_pages;')
    cursor.executemany(
        'INSERT INTO issue_pages (issue_id, page_number, image_url) VALUES (%s, %s, %s);',
        comic_images_batch
    )

    # 6. Reading Progress sample
    cursor.execute("""
    INSERT INTO reading_progress (user_id, comic_id, last_issue_id, last_page_number, progress_percent, is_completed) VALUES
    (2, 1, 1, 5, 62, 0),
    (2, 2, 3, 3, 30, 0)
    ON DUPLICATE KEY UPDATE last_page_number=VALUES(last_page_number), progress_percent=VALUES(progress_percent);
    """)

    # 7. Reading History sample
    cursor.execute("""
    INSERT INTO reading_history (user_id, comic_id, last_issue_id) VALUES
    (2, 1, 1),
    (2, 2, 3),
    (2, 4, 4)
    ON DUPLICATE KEY UPDATE read_at=CURRENT_TIMESTAMP;
    """)

    print("All comic database setup and seed data completed successfully!")
    conn.close()

if __name__ == '__main__':
    run()

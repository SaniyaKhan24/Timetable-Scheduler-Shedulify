import sqlite3
import os

# Get the directory where this script is located
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'timetable.db')

def init_database():
    """Initialize the database with required tables"""
    print(f"🗄️  Initializing database at: {DB_PATH}")
    
    # Remove existing database if it exists
    if os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print("🗑️  Removed existing database")
    
    # Create new database connection
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Create subjects table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT NOT NULL,
            name TEXT NOT NULL,
            hours_per_week INTEGER NOT NULL,
            type TEXT DEFAULT 'theory',
            parent_subject_id INTEGER DEFAULT NULL,
            is_component BOOLEAN DEFAULT 0,
            FOREIGN KEY (parent_subject_id) REFERENCES subjects(id) ON DELETE CASCADE
        )
    ''')
    print("✅ Created subjects table")
    
    # Create faculty table
    cursor.execute('''

        CREATE TABLE IF NOT EXISTS faculty (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            employee_id TEXT UNIQUE NOT NULL,
            department TEXT,
            email TEXT,
            max_hours INTEGER DEFAULT 20,
            year TEXT
        )
    ''')
    print("✅ Created faculty table")
    
    # Create rooms table
    cursor.execute('''

        CREATE TABLE IF NOT EXISTS rooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            number TEXT NOT NULL,
            building TEXT,
            capacity INTEGER,
            type TEXT DEFAULT 'classroom',
            facilities TEXT
        )
    ''')
    print("✅ Created rooms table")
    
    # Create timeslots table
    cursor.execute('''

        CREATE TABLE IF NOT EXISTS timeslots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            day TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT NOT NULL,
            description TEXT
        )
    ''')
    print("✅ Created timeslots table")
    
    # Create divisions table
    cursor.execute('''

        CREATE TABLE IF NOT EXISTS divisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            year TEXT NOT NULL,
            student_count INTEGER
        )
    ''')
    print("✅ Created divisions table")
    
    # Create junction tables
    cursor.execute('''

        CREATE TABLE IF NOT EXISTS faculty_availability (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            faculty_id INTEGER NOT NULL,
            day TEXT NOT NULL,
            FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
        )
    ''')
    print("✅ Created faculty_availability table")
    
    cursor.execute('''

        CREATE TABLE IF NOT EXISTS faculty_timeslots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            faculty_id INTEGER NOT NULL,
            day TEXT NOT NULL,
            time_slot TEXT NOT NULL,
            FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE
        )
    ''')
    print("✅ Created faculty_timeslots table")
    
    cursor.execute('''

        CREATE TABLE IF NOT EXISTS faculty_subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            faculty_id INTEGER NOT NULL,
            subject_id INTEGER NOT NULL,
            FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE,
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
        )
    ''')
    print("✅ Created faculty_subjects junction table")
    
    cursor.execute('''

        CREATE TABLE IF NOT EXISTS faculty_divisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            faculty_id INTEGER NOT NULL,
            division_id INTEGER NOT NULL,
            FOREIGN KEY (faculty_id) REFERENCES faculty(id) ON DELETE CASCADE,
            FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE
        )
    ''')
    print("✅ Created faculty_divisions junction table")
    
    cursor.execute('''

        CREATE TABLE IF NOT EXISTS division_subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            division_id INTEGER NOT NULL,
            subject_id INTEGER NOT NULL,
            FOREIGN KEY (division_id) REFERENCES divisions(id) ON DELETE CASCADE,
            FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
        )
    ''')
    print("✅ Created division_subjects junction table")
    
    # Create users table for authentication
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            full_name TEXT,
            role TEXT DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    print("✅ Created users table")
    
    # Create sessions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            session_token TEXT UNIQUE NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    print("✅ Created sessions table")
    
    # Add user_id to existing tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_timetables (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            fitness_score REAL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            schedule_data TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    print("✅ Created user_timetables table")

    # Do NOT insert any sample data here!
    # ...no sample data...

    # Commit and close
    conn.commit()
    conn.close()
    
    print(f"\n✨ Database initialized successfully at: {DB_PATH}")
    print("🚀 You can now run: python app.py")

if __name__ == '__main__':
    try:
        init_database()
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        import traceback
        traceback.print_exc()

from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS
import sqlite3
import os
from datetime import datetime, timedelta
from genetic_algorithm import GeneticAlgorithm
import hashlib
import secrets
import json

app = Flask(__name__, static_folder='static', static_url_path='')
app.secret_key = secrets.token_hex(32)  # Generate a secure secret key
CORS(app, supports_credentials=True)

# ===== DATABASE HELPERS =====
def get_db_connection():
    """Get SQLite database connection"""
    conn = sqlite3.connect('timetable.db')
    conn.row_factory = sqlite3.Row
    return conn

def fetch_all_data():
    """Fetch all data from database"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Fetch subjects
    subjects = []
    for row in cursor.execute('SELECT * FROM subjects'):
        subjects.append(dict(row))
    
    # Fetch faculty with availability
    faculty = []
    for row in cursor.execute('SELECT * FROM faculty'):
        fac_id = row['id']
        
        # Get available days
        days = [d['day'] for d in cursor.execute(
            'SELECT DISTINCT day FROM faculty_availability WHERE faculty_id = ?', (fac_id,)
        )]
        
        # Get time slots WITH day information
        slots_by_day = {}
        for slot_row in cursor.execute(
            'SELECT day, time_slot FROM faculty_timeslots WHERE faculty_id = ?', (fac_id,)
        ):
            day = slot_row['day']
            if day not in slots_by_day:
                slots_by_day[day] = []
            slots_by_day[day].append(slot_row['time_slot'])
        
        # Get subjects
        subjects_ids = [s['subject_id'] for s in cursor.execute(
            'SELECT subject_id FROM faculty_subjects WHERE faculty_id = ?', (fac_id,)
        )]
        
        # Get divisions
        division_ids = [d['division_id'] for d in cursor.execute(
            'SELECT division_id FROM faculty_divisions WHERE faculty_id = ?', (fac_id,)
        )]
        
        faculty.append({
            'id': fac_id,
            'name': row['name'],
            'employee_id': row['employee_id'],
            'department': row['department'],
            'email': row['email'],
            'max_hours': row['max_hours'],
            'year': row['year'],
            'available_days': days,
            'available_time_slots': slots_by_day,
            'subjects': subjects_ids,
            'divisions': division_ids
        })
    
    # Fetch rooms
    rooms = []
    for row in cursor.execute('SELECT * FROM rooms'):
        rooms.append(dict(row))
    
    # Fetch timeslots
    timeslots = []
    for row in cursor.execute('SELECT * FROM timeslots'):
        timeslots.append(dict(row))
    
    # Fetch divisions
    divisions = []
    for row in cursor.execute('SELECT * FROM divisions'):
        div_id = row['id']
        
        # Get subjects for this division
        div_subjects = [s['subject_id'] for s in cursor.execute(
            'SELECT subject_id FROM division_subjects WHERE division_id = ?', (div_id,)
        )]
        
        divisions.append({
            'id': div_id,
            'name': row['name'],
            'year': row['year'],
            'student_count': row['student_count'],
            'subjects': div_subjects
        })
    
    conn.close()
    
    return {
        'subjects': subjects,
        'faculty': faculty,
        'rooms': rooms,
        'timeslots': timeslots,
        'divisions': divisions
    }

# ===== AUTHENTICATION HELPERS =====
def hash_password(password):
    """Hash password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_session_token():
    """Generate a secure session token"""
    return secrets.token_urlsafe(32)

def get_current_user():
    """Get current logged-in user from session"""
    session_token = session.get('session_token')
    if not session_token:
        return None
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if session is valid - FIX: Use string format for datetime
    user = cursor.execute('''
        SELECT u.* FROM users u
        JOIN sessions s ON u.id = s.user_id
        WHERE s.session_token = ? AND s.expires_at > datetime('now')
    ''', (session_token,)).fetchone()
    
    conn.close()
    return dict(user) if user else None

def require_auth(f):
    """Decorator to require authentication"""
    from functools import wraps
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({'success': False, 'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    return decorated_function

# ===== AUTHENTICATION ROUTES =====
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    try:
        data = request.json
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('fullName', '')
        
        if not username or not email or not password:
            return jsonify({'success': False, 'error': 'All fields are required'}), 400
        
        # Validate password length
        if len(password) < 6:
            return jsonify({'success': False, 'error': 'Password must be at least 6 characters'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user already exists
        existing = cursor.execute('SELECT id FROM users WHERE username = ? OR email = ?', 
                                 (username, email)).fetchone()
        if existing:
            conn.close()
            return jsonify({'success': False, 'error': 'Username or email already exists'}), 400
        
        # Create user
        password_hash = hash_password(password)
        cursor.execute('''
            INSERT INTO users (username, email, password_hash, full_name)
            VALUES (?, ?, ?, ?)
        ''', (username, email, password_hash, full_name))
        
        user_id = cursor.lastrowid
        
        # Create session - FIX: Use SQLite datetime functions
        session_token = generate_session_token()
        
        cursor.execute('''
            INSERT INTO sessions (user_id, session_token, expires_at)
            VALUES (?, ?, datetime('now', '+7 days'))
        ''', (user_id, session_token))
        
        conn.commit()
        conn.close()
        
        # Set session
        session['session_token'] = session_token
        
        print(f"✅ User registered: {username}")
        return jsonify({
            'success': True,
            'user': {
                'id': user_id,
                'username': username,
                'email': email,
                'full_name': full_name
            }
        })
        
    except Exception as e:
        print(f"❌ Signup error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        data = request.json
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'success': False, 'error': 'Username and password required'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Find user
        password_hash = hash_password(password)
        user = cursor.execute('''
            SELECT * FROM users 
            WHERE (username = ? OR email = ?) AND password_hash = ?
        ''', (username, username, password_hash)).fetchone()
        
        if not user:
            conn.close()
            return jsonify({'success': False, 'error': 'Invalid credentials'}), 401
        
        user = dict(user)
        
        # Create session - FIX: Use SQLite datetime functions
        session_token = generate_session_token()
        
        cursor.execute('''
            INSERT INTO sessions (user_id, session_token, expires_at)
            VALUES (?, ?, datetime('now', '+7 days'))
        ''', (user['id'], session_token))
        
        conn.commit()
        conn.close()
        
        # Set session
        session['session_token'] = session_token
        
        print(f"✅ User logged in: {user['username']}")
        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'full_name': user['full_name']
            }
        })
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    try:
        session_token = session.get('session_token')
        if session_token:
            conn = get_db_connection()
            conn.execute('DELETE FROM sessions WHERE session_token = ?', (session_token,))
            conn.commit()
            conn.close()
        
        session.clear()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/auth/me', methods=['GET'])
def get_me():
    user = get_current_user()
    if user:
        return jsonify({
            'success': True,
            'user': {
                'id': user['id'],
                'username': user['username'],
                'email': user['email'],
                'full_name': user['full_name']
            }
        })
    return jsonify({'success': False, 'error': 'Not authenticated'}), 401

# ===== ROUTES =====
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join('static', path)):
        return send_from_directory('static', path)
    return send_from_directory('static', 'index.html')

@app.route('/api/subjects', methods=['POST'])
def add_subject():
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        subject_code = data['code']
        subject_name = data['name']
        components = data.get('components', ['theory'])  # ['theory', 'lab', 'tutorial']
        
        created_subjects = []
        
        # If only one component (theory/lab/tutorial), create single subject
        if len(components) == 1:
            cursor.execute('''
                INSERT INTO subjects (code, name, hours_per_week, type, is_component)
                VALUES (?, ?, ?, ?, 0)
            ''', (subject_code, subject_name, data['hours'], components[0]))
            
            subject_id = cursor.lastrowid
            created_subjects.append({
                'id': subject_id,
                'code': subject_code,
                'name': subject_name,
                'type': components[0]
            })
        else:
            # Create parent subject (for grouping only, not used in scheduling)
            cursor.execute('''
                INSERT INTO subjects (code, name, hours_per_week, type, is_component)
                VALUES (?, ?, 0, 'parent', 0)
            ''', (subject_code, subject_name))
            
            parent_id = cursor.lastrowid
            
            # Create theory component
            if 'theory' in components:
                theory_hours = data.get('theoryHours', 0)
                if theory_hours > 0:
                    cursor.execute('''
                        INSERT INTO subjects (code, name, hours_per_week, type, parent_subject_id, is_component)
                        VALUES (?, ?, ?, 'theory', ?, 1)
                    ''', (f"{subject_code}-T", f"{subject_name} (Theory)", theory_hours, parent_id))
                    
                    created_subjects.append({
                        'id': cursor.lastrowid,
                        'code': f"{subject_code}-T",
                        'name': f"{subject_name} (Theory)",
                        'type': 'theory'
                    })
            
            # Create lab component
            if 'lab' in components:
                lab_hours = data.get('labHours', 0)
                if lab_hours > 0:
                    cursor.execute('''
                        INSERT INTO subjects (code, name, hours_per_week, type, parent_subject_id, is_component)
                        VALUES (?, ?, ?, 'lab', ?, 1)
                    ''', (f"{subject_code}-L", f"{subject_name} (Lab)", lab_hours, parent_id))
                    
                    created_subjects.append({
                        'id': cursor.lastrowid,
                        'code': f"{subject_code}-L",
                        'name': f"{subject_name} (Lab)",
                        'type': 'lab'
                    })
            
            # Create tutorial component
            if 'tutorial' in components:
                tutorial_hours = data.get('tutorialHours', 0)
                if tutorial_hours > 0:
                    cursor.execute('''
                        INSERT INTO subjects (code, name, hours_per_week, type, parent_subject_id, is_component)
                        VALUES (?, ?, ?, 'tutorial', ?, 1)
                    ''', (f"{subject_code}-TUT", f"{subject_name} (Tutorial)", tutorial_hours, parent_id))
                    
                    created_subjects.append({
                        'id': cursor.lastrowid,
                        'code': f"{subject_code}-TUT",
                        'name': f"{subject_name} (Tutorial)",
                        'type': 'tutorial'
                    })
        
        conn.commit()
        conn.close()
        
        print(f"✅ Added subject(s): {subject_name} - {len(created_subjects)} component(s)")
        return jsonify({'success': True, 'subjects': created_subjects})
    except Exception as e:
        print(f"❌ Error adding subject: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/faculty', methods=['POST'])
def add_faculty():
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO faculty (name, employee_id, department, email, max_hours, year)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (data['name'], data['employeeId'], data['department'], 
              data.get('email'), data['maxHours'], data['year']))
        
        faculty_id = cursor.lastrowid
        
        # Insert availability days
        for day in data.get('availableDays', []):
            cursor.execute('INSERT INTO faculty_availability (faculty_id, day) VALUES (?, ?)',
                         (faculty_id, day))
        
        # ✅ NEW: Insert time slots WITH day information
        available_days = data.get('availableDays', [])
        available_slots = data.get('availableTimeSlots', [])
        
        # For each selected day, add all selected time slots
        for day in available_days:
            for slot in available_slots:
                cursor.execute(
                    'INSERT INTO faculty_timeslots (faculty_id, day, time_slot) VALUES (?, ?, ?)',
                    (faculty_id, day, slot)
                )
        
        # Insert subject assignments
        for subj_id in data.get('subjects', []):
            cursor.execute('INSERT INTO faculty_subjects (faculty_id, subject_id) VALUES (?, ?)',
                         (faculty_id, subj_id))
        
        # Insert division assignments
        for div_id in data.get('divisions', []):
            cursor.execute('INSERT INTO faculty_divisions (faculty_id, division_id) VALUES (?, ?)',
                         (faculty_id, div_id))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Added faculty: {data['name']}")
        return jsonify({'success': True, 'id': faculty_id})
    except Exception as e:
        print(f"❌ Error adding faculty: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/rooms', methods=['POST'])
def add_room():
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO rooms (number, building, capacity, type, facilities)
            VALUES (?, ?, ?, ?, ?)
        ''', (data['number'], data['building'], data['capacity'], 
              data['type'], data.get('facilities', '')))
        
        conn.commit()
        room_id = cursor.lastrowid
        conn.close()
        
        print(f"✅ Added room: {data['number']}")
        return jsonify({'success': True, 'id': room_id})
    except Exception as e:
        print(f"❌ Error adding room: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/divisions', methods=['POST'])
def add_division():
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO divisions (name, year, student_count)
            VALUES (?, ?, ?)
        ''', (data['name'], data['year'], data['studentCount']))
        
        division_id = cursor.lastrowid
        
        # Insert subject assignments
        for subj_id in data.get('subjects', []):
            cursor.execute('INSERT INTO division_subjects (division_id, subject_id) VALUES (?, ?)',
                         (division_id, subj_id))
        
        conn.commit()
        conn.close()
        
        print(f"✅ Added division: {data['name']}")
        return jsonify({'success': True, 'id': division_id})
    except Exception as e:
        print(f"❌ Error adding division: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/timeslots', methods=['POST'])
def add_timeslot():
    try:
        data = request.json
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO timeslots (day, start_time, end_time, description)
            VALUES (?, ?, ?, ?)
        ''', (data['day'], data['startTime'], data['endTime'], data.get('description', '')))
        
        conn.commit()
        slot_id = cursor.lastrowid
        conn.close()
        
        print(f"✅ Added timeslot: {data['day']} {data['startTime']}-{data['endTime']}")
        return jsonify({'success': True, 'id': slot_id})
    except Exception as e:
        print(f"❌ Error adding timeslot: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ===== GET ENDPOINTS FOR CRUD =====
@app.route('/api/subjects', methods=['GET'])
def get_subjects():
    try:
        conn = get_db_connection()
        subjects = [dict(row) for row in conn.execute('SELECT * FROM subjects').fetchall()]
        conn.close()
        return jsonify({'success': True, 'data': subjects})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/faculty', methods=['GET'])
def get_faculty():
    try:
        data = fetch_all_data()
        return jsonify({'success': True, 'data': data['faculty']})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/rooms', methods=['GET'])
def get_rooms():
    try:
        conn = get_db_connection()
        rooms = [dict(row) for row in conn.execute('SELECT * FROM rooms').fetchall()]
        conn.close()
        return jsonify({'success': True, 'data': rooms})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/divisions', methods=['GET'])
def get_divisions():
    try:
        data = fetch_all_data()
        return jsonify({'success': True, 'data': data['divisions']})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/timeslots', methods=['GET'])
def get_timeslots():
    try:
        conn = get_db_connection()
        timeslots = [dict(row) for row in conn.execute('SELECT * FROM timeslots').fetchall()]
        conn.close()
        return jsonify({'success': True, 'data': timeslots})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ===== DELETE ENDPOINTS =====
@app.route('/api/subjects/<int:id>', methods=['DELETE'])
def delete_subject(id):
    try:
        conn = get_db_connection()
        conn.execute('DELETE FROM subjects WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/faculty/<int:id>', methods=['DELETE'])
def delete_faculty(id):
    try:
        conn = get_db_connection()
        conn.execute('DELETE FROM faculty WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/rooms/<int:id>', methods=['DELETE'])
def delete_room(id):
    try:
        conn = get_db_connection()
        conn.execute('DELETE FROM rooms WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/divisions/<int:id>', methods=['DELETE'])
def delete_division(id):
    try:
        conn = get_db_connection()
        conn.execute('DELETE FROM divisions WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/timeslots/<int:id>', methods=['DELETE'])
def delete_timeslot(id):
    try:
        conn = get_db_connection()
        conn.execute('DELETE FROM timeslots WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def validate_generation_data():
    """Validate that all required data exists before generation"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    errors = []
    
    subjects_count = cursor.execute('SELECT COUNT(*) FROM subjects WHERE is_component = 0 OR is_component IS NULL').fetchone()[0]
    if subjects_count == 0:
        errors.append('No subjects found. Add at least one subject.')
    
    faculty_count = cursor.execute('SELECT COUNT(*) FROM faculty').fetchone()[0]
    if faculty_count == 0:
        errors.append('No faculty members found. Add at least one faculty member.')
    
    rooms_count = cursor.execute('SELECT COUNT(*) FROM rooms').fetchone()[0]
    if rooms_count == 0:
        errors.append('No rooms found. Add at least one room.')
    
    timeslots_count = cursor.execute('SELECT COUNT(*) FROM timeslots').fetchone()[0]
    if timeslots_count == 0:
        errors.append('No time slots found. Add time slots for the week.')
    
    divisions_count = cursor.execute('SELECT COUNT(*) FROM divisions').fetchone()[0]
    if divisions_count == 0:
        errors.append('No divisions found. Add at least one division.')
    
    # Check faculty assignments
    unassigned_faculty = cursor.execute('''
        SELECT f.name FROM faculty f
        WHERE NOT EXISTS (SELECT 1 FROM faculty_subjects WHERE faculty_id = f.id)
    ''').fetchall()
    if unassigned_faculty:
        errors.append(f'Faculty without subjects: {", ".join([f[0] for f in unassigned_faculty])}')
    
    # Check division assignments
    unassigned_divisions = cursor.execute('''
        SELECT d.name FROM divisions d
        WHERE NOT EXISTS (SELECT 1 FROM division_subjects WHERE division_id = d.id)
    ''').fetchall()
    if unassigned_divisions:
        errors.append(f'Divisions without subjects: {", ".join([d[0] for d in unassigned_divisions])}')
    
    conn.close()
    return errors

# Add new endpoint for validation:
@app.route('/api/timetable/validate', methods=['GET'])
@require_auth
def validate_data():
    """Validate all data before generation"""
    try:
        errors = validate_generation_data()
        
        if errors:
            return jsonify({
                'success': False,
                'valid': False,
                'errors': errors
            }), 400
        
        return jsonify({
            'success': True,
            'valid': True,
            'message': 'All data validated successfully'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Add schedule conflict checking:
@app.route('/api/timetable/check-conflicts', methods=['POST'])
@require_auth
def check_conflicts():
    """Check for conflicts in a given schedule"""
    try:
        data = request.json
        schedule = data.get('schedule', [])
        
        conflicts = []
        
        # Track usage
        faculty_slots = {}
        room_slots = {}
        division_slots = {}
        
        for entry in schedule:
            key = f"{entry['day']}_{entry['timeSlot']}"
            
            # Check faculty conflicts
            faculty = entry.get('faculty')
            if faculty:
                if faculty not in faculty_slots:
                    faculty_slots[faculty] = []
                if key in faculty_slots[faculty]:
                    conflicts.append(f"Faculty {faculty} double-booked at {entry['day']} {entry['timeSlot']}")
                faculty_slots[faculty].append(key)
            
            # Check room conflicts
            room = entry.get('room')
            if room:
                if room not in room_slots:
                    room_slots[room] = []
                if key in room_slots[room]:
                    conflicts.append(f"Room {room} double-booked at {entry['day']} {entry['timeSlot']}")
                room_slots[room].append(key)
            
            # Check division conflicts
            division = entry.get('division')
            if division:
                if division not in division_slots:
                    division_slots[division] = []
                if key in division_slots[division]:
                    conflicts.append(f"Division {division} has overlapping classes at {entry['day']} {entry['timeSlot']}")
                division_slots[division].append(key)
        
        return jsonify({
            'success': True,
            'has_conflicts': len(conflicts) > 0,
            'conflicts': conflicts,
            'conflict_count': len(conflicts)
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Add faculty availability endpoint:
@app.route('/api/faculty/<int:id>/availability', methods=['GET'])
@require_auth
def get_faculty_availability(id):
    """Get detailed availability for a faculty member"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        faculty = cursor.execute('SELECT * FROM faculty WHERE id = ?', (id,)).fetchone()
        if not faculty:
            conn.close()
            return jsonify({'success': False, 'error': 'Faculty not found'}), 404
        
        # Get available days
        days = [d['day'] for d in cursor.execute(
            'SELECT DISTINCT day FROM faculty_availability WHERE faculty_id = ?', (id,)
        )]
        
        # Get time slots by day
        slots_by_day = {}
        for slot_row in cursor.execute(
            'SELECT day, time_slot FROM faculty_timeslots WHERE faculty_id = ?', (id,)
        ):
            day = slot_row['day']
            if day not in slots_by_day:
                slots_by_day[day] = []
            slots_by_day[day].append(slot_row['time_slot'])
        
        conn.close()
        
        return jsonify({
            'success': True,
            'faculty': dict(faculty),
            'available_days': days,
            'available_slots': slots_by_day
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# Update generate_timetable to add validation:
@app.route('/api/timetable/generate', methods=['POST', 'OPTIONS'])
@require_auth
def generate_timetable():
    """Generate optimized timetable using genetic algorithm"""
    
    if request.method == 'OPTIONS':
        return '', 200
    
    print(f"\n{'='*60}")
    print(f"🧬 TIMETABLE GENERATION REQUEST RECEIVED")
    print(f"{'='*60}")
    
    try:
        # Validate data first
        validation_errors = validate_generation_data()
        if validation_errors:
            return jsonify({
                'success': False,
                'error': 'Data validation failed',
                'validation_errors': validation_errors
            }), 400
        
        data = request.json
        print(f"📊 Request data: {data}")
        
        from genetic_algorithm import GeneticAlgorithm
        ga = GeneticAlgorithm()
        ga.population_size = data.get('populationSize', 50)
        ga.generations = data.get('generations', 100)
        ga.mutation_rate = data.get('mutationRate', 0.1)
        
        print(f"🔧 Algorithm configured: pop={ga.population_size}, gen={ga.generations}, mut={ga.mutation_rate}")
        
        # Get data from database
        print(f"📂 Fetching data from database...")
        all_data = fetch_all_data()
        subjects = all_data['subjects']
        faculty_list = all_data['faculty']
        rooms = all_data['rooms']
        timeslots = all_data['timeslots']
        divisions = all_data['divisions']
        
        print(f"📊 Data loaded:")
        print(f"   Subjects: {len(subjects)}")
        print(f"   Faculty: {len(faculty_list)}")
        print(f"   Rooms: {len(rooms)}")
        print(f"   Timeslots: {len(timeslots)}")
        print(f"   Divisions: {len(divisions)}")
        
        # Run genetic algorithm
        print(f"\n🔄 Starting genetic algorithm evolution...")
        best_timetable, history = ga.evolve(subjects, faculty_list, rooms, timeslots, divisions)
        
        if not best_timetable or not best_timetable.genes:
            print("❌ Timetable generation failed.")
            if best_timetable and hasattr(best_timetable, "conflicts"):
                print("Conflicts/diagnostics:")
                for c in best_timetable.conflicts:
                    print("  -", c)
            return jsonify({
                'success': False,
                'error': 'Failed to generate valid timetable. Try increasing population size or generations.',
                'conflicts': getattr(best_timetable, 'conflicts', [])
            }), 400
        
        print(f"✅ Evolution complete!")
        print(f"   Best fitness: {best_timetable.fitness:.2f}")
        print(f"   Total genes: {len(best_timetable.genes)}")
        print(f"   Conflicts: {len(best_timetable.conflicts)}")
        
        # Reject if too many conflicts
        if len(best_timetable.conflicts) > 10:
            return jsonify({
                'success': False,
                'error': f'Generated timetable has {len(best_timetable.conflicts)} conflicts. Please review your data or increase generations.',
                'conflicts': best_timetable.conflicts,
                'fitness_score': round(best_timetable.fitness, 2)
            }), 400
        
        # Convert to schedule format
        schedule = []
        for gene in best_timetable.genes:
            subject = next((s for s in subjects if s['id'] == gene.subject_id), None)
            fac = next((f for f in faculty_list if f['id'] == gene.faculty_id), None)
            room = next((r for r in rooms if r['id'] == gene.room_id), None)
            slot = next((t for t in timeslots if t['id'] == gene.timeslot_id), None)
            division = next((d for d in divisions if d['id'] == gene.division_id), None)
            
            if subject and fac and room and slot and division:
                schedule.append({
                    'division': division['name'],
                    'subject': f"{subject['code']} - {subject['name']}",
                    'subjectCode': subject['code'],
                    'subjectName': subject['name'],
                    'faculty': fac['name'],
                    'room': f"{room['number']} ({room['building']})",
                    'day': slot['day'],
                    'timeSlot': f"{slot['start_time']} - {slot['end_time']}",
                    'type': subject.get('type', 'theory')
                })
        
        print(f"📅 Generated {len(schedule)} class sessions")
        print(f"{'='*60}\n")
        
        return jsonify({
            'success': True,
            'fitness_score': round(best_timetable.fitness, 2),
            'schedule': schedule,
            'conflicts': best_timetable.conflicts,
            'conflict_count': len(best_timetable.conflicts),
            'algorithm': 'Genetic Algorithm',
            'generation_stats': {
                'population_size': ga.population_size,
                'generations': ga.generations,
                'mutation_rate': ga.mutation_rate
            }
        })
        
    except Exception as e:
        print(f"\n{'='*60}")
        print(f"❌ CRITICAL ERROR")
        print(f"{'='*60}")
        print(f"Error type: {type(e).__name__}")
        print(f"Error message: {str(e)}")
        import traceback
        traceback.print_exc()
        print(f"{'='*60}\n")
        
        return jsonify({
            'success': False, 
            'error': f'{type(e).__name__}: {str(e)}'
        }), 500

@app.route('/api/timetable/save', methods=['POST'])
@require_auth
def save_timetable():
    try:
        user = get_current_user()
        data = request.json
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO user_timetables (user_id, name, fitness_score, schedule_data)
            VALUES (?, ?, ?, ?)
        ''', (user['id'], data.get('name', 'Timetable'), 
              data.get('fitness_score'), json.dumps(data.get('schedule', []))))
        
        conn.commit()
        timetable_id = cursor.lastrowid
        conn.close()
        
        return jsonify({'success': True, 'id': timetable_id})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/timetable/my-timetables', methods=['GET'])
@require_auth
def get_my_timetables():
    try:
        user = get_current_user()
        conn = get_db_connection()
        
        timetables = []
        for row in conn.execute('''
            SELECT * FROM user_timetables WHERE user_id = ? ORDER BY created_at DESC
        ''', (user['id'],)):
            tt = dict(row)
            tt['schedule'] = json.loads(tt['schedule_data']) if tt['schedule_data'] else []
            del tt['schedule_data']
            timetables.append(tt)
        
        conn.close()
        return jsonify({'success': True, 'timetables': timetables})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 Schedulify Backend with Genetic Algorithm")
    print("="*60)
    print("📍 Server: http://localhost:5000")
    print("📍 Dashboard: http://localhost:5000/dashboard.html")
    print("🧬 Algorithm: Genetic Algorithm")
    print("   - Population-based evolution")
    print("   - Tournament selection")
    print("   - Single-point crossover")
    print("   - Random mutation")
    print("   - Elitism (top 10%)")
    print("="*60 + "\n")
    app.run(debug=True, port=5000, use_reloader=True)

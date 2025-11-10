import sqlite3
from typing import List, Dict, Optional, Tuple

class BacktrackingSolver:
    def __init__(self, db_path='timetable.db'):
        self.db_path = db_path
        self.solution = []
        self.conflicts = []
        self.assignments_tried = 0
        self.backtrack_count = 0
    
    def get_data(self):
        """Fetch all necessary data from database"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        
        subjects = [dict(row) for row in conn.execute('SELECT * FROM subjects WHERE is_component = 1 OR is_component IS NULL').fetchall()]
        
        # Fetch faculty with availability
        faculty = []
        for row in conn.execute('SELECT * FROM faculty').fetchall():
            fac_id = row['id']
            
            # Get available days
            days = [d['day'] for d in conn.execute(
                'SELECT DISTINCT day FROM faculty_availability WHERE faculty_id = ?', (fac_id,)
            )]
            
            # Get time slots by day
            slots_by_day = {}
            for slot_row in conn.execute(
                'SELECT day, time_slot FROM faculty_timeslots WHERE faculty_id = ?', (fac_id,)
            ):
                day = slot_row['day']
                if day not in slots_by_day:
                    slots_by_day[day] = []
                slots_by_day[day].append(slot_row['time_slot'])
            
            # Get subjects
            subjects_ids = [s['subject_id'] for s in conn.execute(
                'SELECT subject_id FROM faculty_subjects WHERE faculty_id = ?', (fac_id,)
            )]
            
            # Get divisions
            division_ids = [d['division_id'] for d in conn.execute(
                'SELECT division_id FROM faculty_divisions WHERE faculty_id = ?', (fac_id,)
            )]
            
            faculty.append({
                'id': fac_id,
                'name': row['name'],
                'available_days': days,
                'available_time_slots': slots_by_day,
                'subjects': subjects_ids,
                'divisions': division_ids,
                'max_hours': row['max_hours']
            })
        
        rooms = [dict(row) for row in conn.execute('SELECT * FROM rooms').fetchall()]
        timeslots = [dict(row) for row in conn.execute('SELECT * FROM timeslots').fetchall()]
        
        # Fetch divisions
        divisions = []
        for row in conn.execute('SELECT * FROM divisions').fetchall():
            div_id = row['id']
            div_subjects = [s['subject_id'] for s in conn.execute(
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
        return subjects, faculty, rooms, timeslots, divisions
    
    def is_valid_assignment(self, division_id, subject_id, faculty_id, room_id, timeslot_id, 
                          current_schedule, faculty_list, rooms, timeslots, divisions):
        """Check if assignment is valid (no conflicts)"""
        
        # Get details
        timeslot = next((t for t in timeslots if t['id'] == timeslot_id), None)
        if not timeslot:
            return False, "Invalid timeslot"
        
        faculty = next((f for f in faculty_list if f['id'] == faculty_id), None)
        if not faculty:
            return False, "Invalid faculty"
        
        room = next((r for r in rooms if r['id'] == room_id), None)
        if not room:
            return False, "Invalid room"
        
        division = next((d for d in divisions if d['id'] == division_id), None)
        if not division:
            return False, "Invalid division"
        
        # Check faculty availability
        slot_day = timeslot['day']
        slot_time = f"{timeslot['start_time']}-{timeslot['end_time']}"
        
        if slot_day not in faculty.get('available_days', []):
            return False, f"Faculty not available on {slot_day}"
        
        day_slots = faculty.get('available_time_slots', {}).get(slot_day, [])
        if slot_time not in day_slots:
            return False, f"Faculty not available at {slot_time}"
        
        # Check faculty can teach this subject to this division
        if subject_id not in faculty.get('subjects', []):
            return False, "Faculty not assigned to this subject"
        
        if division_id not in faculty.get('divisions', []):
            return False, "Faculty not assigned to this division"
        
        # Check for conflicts in current schedule
        for scheduled in current_schedule:
            s_div, s_sub, s_fac, s_room, s_time = scheduled
            
            # Same timeslot
            if s_time == timeslot_id:
                # Faculty conflict
                if s_fac == faculty_id:
                    return False, "Faculty already teaching at this time"
                
                # Room conflict
                if s_room == room_id:
                    return False, "Room already occupied at this time"
                
                # Division conflict
                if s_div == division_id:
                    return False, "Division already has a class at this time"
        
        # Check room capacity
        if room['capacity'] < division['student_count']:
            return False, f"Room too small ({room['capacity']} < {division['student_count']})"
        
        return True, None
    
    def solve(self, max_iterations=10000, progress_callback=None):
        """Solve timetable using backtracking with iteration limit"""
        subjects, faculty_list, rooms, timeslots, divisions = self.get_data()
        
        if not subjects or not faculty_list or not rooms or not timeslots or not divisions:
            raise Exception("Insufficient data. Please add subjects, faculty, rooms, timeslots, and divisions.")
        
        # Build list of all required assignments
        required_assignments = []
        for division in divisions:
            div_subjects = [s for s in subjects if s['id'] in division['subjects']]
            for subject in div_subjects:
                hours_needed = subject['hours_per_week']
                for _ in range(hours_needed):
                    required_assignments.append((division['id'], subject['id']))
        
        print(f"🔍 Backtracking: Need to schedule {len(required_assignments)} classes")
        
        schedule = []
        self.assignments_tried = 0
        self.backtrack_count = 0
        
        def backtrack(assignment_index):
            # Check iteration limit
            self.assignments_tried += 1
            if self.assignments_tried > max_iterations:
                return False
            
            # Base case: all assignments scheduled
            if assignment_index >= len(required_assignments):
                return True
            
            division_id, subject_id = required_assignments[assignment_index]
            
            # Get eligible faculty for this subject and division
            eligible_faculty = [
                f for f in faculty_list
                if subject_id in f.get('subjects', [])
                and division_id in f.get('divisions', [])
            ]
            
            if not eligible_faculty:
                self.conflicts.append(f"No eligible faculty for subject {subject_id} in division {division_id}")
                return False
            
            # Try all combinations
            for faculty_member in eligible_faculty:
                for room in rooms:
                    for timeslot in timeslots:
                        is_valid, error = self.is_valid_assignment(
                            division_id, subject_id, faculty_member['id'], 
                            room['id'], timeslot['id'],
                            schedule, faculty_list, rooms, timeslots, divisions
                        )
                        
                        if is_valid:
                            assignment = (
                                division_id, subject_id, faculty_member['id'],
                                room['id'], timeslot['id']
                            )
                            schedule.append(assignment)
                            
                            # Progress callback
                            if progress_callback and assignment_index % 5 == 0:
                                progress = ((assignment_index + 1) / len(required_assignments)) * 100
                                progress_callback(int(progress))
                            
                            # Recurse
                            if backtrack(assignment_index + 1):
                                return True
                            
                            # Backtrack
                            schedule.pop()
                            self.backtrack_count += 1
            
            return False
        
        # Start backtracking
        print("🔄 Starting backtracking...")
        success = backtrack(0)
        
        print(f"📊 Tried {self.assignments_tried} assignments, backtracked {self.backtrack_count} times")
        
        if success:
            print(f"✅ Found solution with {len(schedule)} scheduled classes")
            return schedule, subjects, faculty_list, rooms, timeslots, divisions
        else:
            if self.assignments_tried >= max_iterations:
                raise Exception(f"Backtracking exceeded {max_iterations} iterations. Try simplifying constraints or using Genetic Algorithm.")
            else:
                raise Exception("No valid timetable found. Try adding more rooms, timeslots, or relaxing faculty availability.")

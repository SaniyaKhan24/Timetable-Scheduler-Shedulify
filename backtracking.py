import sqlite3
from typing import List, Dict, Optional

class BacktrackingSolver:
    def __init__(self, db_path='timetable.db'):
        self.db_path = db_path
        self.solution = []
        self.conflicts = []
    
    def get_data(self):
        """Fetch all necessary data from database"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        
        subjects = [dict(row) for row in conn.execute('SELECT * FROM subjects').fetchall()]
        faculty = [dict(row) for row in conn.execute('SELECT * FROM faculty').fetchall()]
        rooms = [dict(row) for row in conn.execute('SELECT * FROM rooms').fetchall()]
        timeslots = [dict(row) for row in conn.execute('SELECT * FROM timeslots').fetchall()]
        
        conn.close()
        return subjects, faculty, rooms, timeslots
    
    def is_valid_assignment(self, assignment, current_schedule):
        """Check if assignment is valid (no conflicts)"""
        subject_id, faculty_id, room_id, timeslot_id = assignment
        
        for scheduled in current_schedule:
            s_sub, s_fac, s_room, s_time = scheduled
            
            # Same timeslot
            if s_time == timeslot_id:
                # Faculty conflict
                if s_fac == faculty_id:
                    return False, "Faculty already teaching at this time"
                
                # Room conflict
                if s_room == room_id:
                    return False, "Room already occupied at this time"
        
        return True, None
    
    def solve(self, progress_callback=None):
        """Solve timetable using backtracking"""
        subjects, faculty, rooms, timeslots = self.get_data()
        
        if not subjects or not faculty or not rooms or not timeslots:
            raise Exception("Insufficient data. Please add subjects, faculty, rooms, and timeslots.")
        
        schedule = []
        
        def backtrack(subject_index):
            # Base case: all subjects scheduled
            if subject_index >= len(subjects):
                return True
            
            subject = subjects[subject_index]
            
            # Try all combinations
            for faculty_member in faculty:
                for room in rooms:
                    for timeslot in timeslots:
                        assignment = (
                            subject['id'],
                            faculty_member['id'],
                            room['id'],
                            timeslot['id']
                        )
                        
                        is_valid, error = self.is_valid_assignment(assignment, schedule)
                        
                        if is_valid:
                            schedule.append(assignment)
                            
                            # Progress callback
                            if progress_callback:
                                progress = ((subject_index + 1) / len(subjects)) * 100
                                progress_callback(int(progress))
                            
                            # Recurse
                            if backtrack(subject_index + 1):
                                return True
                            
                            # Backtrack
                            schedule.pop()
            
            return False
        
        # Start backtracking
        success = backtrack(0)
        
        if success:
            return schedule, subjects, faculty, rooms, timeslots
        else:
            raise Exception("No valid timetable found. Try adding more rooms or timeslots.")

from models import Schedule, ScheduleEntry
from typing import List

class FitnessEvaluator:
    def __init__(self, weights=None):
        self.weights = weights or {
            'hard_constraint': 1000,
            'faculty_workload': 10,
            'room_utilization': 5,
            'student_gaps': 8
        }
    
    def evaluate(self, schedule: Schedule) -> float:
        """Calculate fitness score (higher is better)"""
        score = 10000  # Start with perfect score
        
        # Hard constraints (conflicts)
        score -= self._check_conflicts(schedule) * self.weights['hard_constraint']
        
        # Soft constraints
        score -= self._check_faculty_workload_balance(schedule) * self.weights['faculty_workload']
        score -= self._check_room_utilization(schedule) * self.weights['room_utilization']
        score -= self._check_student_gaps(schedule) * self.weights['student_gaps']
        
        return max(0, score)
    
    def _check_conflicts(self, schedule: Schedule) -> int:
        """Check for faculty, room, and time conflicts"""
        conflicts = 0
        entries = schedule.entries
        
        for i, entry1 in enumerate(entries):
            for entry2 in entries[i+1:]:
                if entry1.time_slot.id == entry2.time_slot.id:
                    # Same time slot - check conflicts
                    if entry1.faculty.id == entry2.faculty.id:
                        conflicts += 1  # Faculty double-booked
                    if entry1.room.id == entry2.room.id:
                        conflicts += 1  # Room double-booked
                        
        return conflicts
    
    def _check_faculty_workload_balance(self, schedule: Schedule) -> int:
        """Check if faculty workload is balanced"""
        faculty_hours = {}
        penalty = 0
        
        for entry in schedule.entries:
            fid = entry.faculty.id
            faculty_hours[fid] = faculty_hours.get(fid, 0) + 1
            
        # Penalize if exceeds max hours
        for entry in schedule.entries:
            fid = entry.faculty.id
            if faculty_hours[fid] > entry.faculty.max_hours_per_week:
                penalty += (faculty_hours[fid] - entry.faculty.max_hours_per_week)
                
        return penalty
    
    def _check_room_utilization(self, schedule: Schedule) -> int:
        """Check room capacity vs student count"""
        penalty = 0
        
        for entry in schedule.entries:
            if entry.room.capacity < entry.subject.student_count:
                penalty += (entry.subject.student_count - entry.room.capacity) // 10
                
        return penalty
    
    def _check_student_gaps(self, schedule: Schedule) -> int:
        """Minimize gaps in student schedules (simplified)"""
        # Group by day and sort by time
        penalty = 0
        # Simplified: penalize if classes are too spread out
        return penalty

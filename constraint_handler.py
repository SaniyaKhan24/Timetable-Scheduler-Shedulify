from models import Schedule, ScheduleEntry, Subject, Faculty, Room, TimeSlot
from typing import List, Optional
import copy

class ConstraintHandler:
    def __init__(self, time_slots: List[TimeSlot], rooms: List[Room], 
                 faculty: List[Faculty], subjects: List[Subject]):
        self.time_slots = time_slots
        self.rooms = rooms
        self.faculty = faculty
        self.subjects = subjects
        
    def is_valid_assignment(self, schedule: Schedule, new_entry: ScheduleEntry) -> bool:
        """Check if adding new entry violates constraints"""
        # Check faculty conflict
        for entry in schedule.entries:
            if entry.time_slot.id == new_entry.time_slot.id:
                if entry.faculty.id == new_entry.faculty.id:
                    return False
                if entry.room.id == new_entry.room.id:
                    return False
                    
        # Check faculty availability
        if new_entry.time_slot.id not in new_entry.faculty.available_slots:
            return False
            
        # Check room capacity
        if new_entry.room.capacity < new_entry.subject.student_count:
            return False
            
        # Check room type match
        if new_entry.room.room_type != new_entry.subject.room_type:
            return False
            
        return True
    
    def repair_schedule(self, schedule: Schedule) -> Schedule:
        """Use backtracking to repair conflicts in schedule"""
        repaired = Schedule()
        
        for entry in schedule.entries:
            if self.is_valid_assignment(repaired, entry):
                repaired.add_entry(entry)
            else:
                # Try to find alternative slot/room
                fixed_entry = self._find_alternative(repaired, entry)
                if fixed_entry:
                    repaired.add_entry(fixed_entry)
                    
        return repaired
    
    def _find_alternative(self, schedule: Schedule, entry: ScheduleEntry) -> Optional[ScheduleEntry]:
        """Backtracking: find alternative time slot or room"""
        # Try different time slots
        for ts in self.time_slots:
            if ts.id in entry.faculty.available_slots:
                new_entry = ScheduleEntry(entry.subject, entry.faculty, entry.room, ts)
                if self.is_valid_assignment(schedule, new_entry):
                    return new_entry
                    
        # Try different rooms with original time slot
        for room in self.rooms:
            if room.room_type == entry.subject.room_type:
                new_entry = ScheduleEntry(entry.subject, entry.faculty, room, entry.time_slot)
                if self.is_valid_assignment(schedule, new_entry):
                    return new_entry
                    
        return None
    
    def branch_and_bound_prune(self, partial_schedule: Schedule, remaining_subjects: List[Subject], 
                                best_score: float, fitness_evaluator) -> bool:
        """Determine if current branch should be pruned"""
        # Calculate upper bound (optimistic estimate)
        current_score = fitness_evaluator.evaluate(partial_schedule)
        potential_score = current_score + len(remaining_subjects) * 100  # Optimistic
        
        # Prune if can't beat current best
        return potential_score < best_score

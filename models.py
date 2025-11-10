from dataclasses import dataclass, field
from typing import List, Optional, Dict
import json

@dataclass
class TimeSlot:
    id: int
    day: str
    start_time: str
    end_time: str
    
    def __str__(self):
        return f"{self.day} {self.start_time}-{self.end_time}"
    
    def __post_init__(self):
        """Validate timeslot data"""
        valid_days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        if self.day not in valid_days:
            raise ValueError(f"Invalid day: {self.day}. Must be one of {valid_days}")

@dataclass
class Room:
    id: int
    name: str
    capacity: int
    room_type: str  # 'lab', 'lecture', 'tutorial'
    
    def __post_init__(self):
        """Validate room data"""
        if self.capacity <= 0:
            raise ValueError(f"Room capacity must be positive, got {self.capacity}")
        valid_types = ['lab', 'lecture', 'tutorial', 'classroom', 'auditorium']
        if self.room_type not in valid_types:
            raise ValueError(f"Invalid room type: {self.room_type}")

@dataclass
class Faculty:
    id: int
    name: str
    department: str
    max_hours_per_week: int
    available_slots: List[int] = field(default_factory=list)
    available_days: List[str] = field(default_factory=list)
    available_time_slots: Dict[str, List[str]] = field(default_factory=dict)
    
    def __post_init__(self):
        """Validate faculty data"""
        if self.max_hours_per_week <= 0:
            raise ValueError(f"Max hours must be positive, got {self.max_hours_per_week}")
        
        # Ensure available_time_slots is a dict
        if isinstance(self.available_time_slots, str):
            try:
                self.available_time_slots = json.loads(self.available_time_slots)
            except:
                self.available_time_slots = {}
        elif not isinstance(self.available_time_slots, dict):
            self.available_time_slots = {}
    
    def is_available(self, day: str, time_slot: str) -> bool:
        """Check if faculty is available on a specific day and time"""
        if day not in self.available_days:
            return False
        return time_slot in self.available_time_slots.get(day, [])
    
    def get_total_available_hours(self) -> int:
        """Calculate total available hours per week"""
        return sum(len(slots) for slots in self.available_time_slots.values())

@dataclass
class Subject:
    id: int
    name: str
    code: str
    faculty_id: int
    hours_per_week: int
    room_type: str
    student_count: int
    
    def __post_init__(self):
        """Validate subject data"""
        if self.hours_per_week <= 0:
            raise ValueError(f"Hours per week must be positive, got {self.hours_per_week}")
        if self.student_count <= 0:
            raise ValueError(f"Student count must be positive, got {self.student_count}")

@dataclass
class ScheduleEntry:
    subject: Subject
    faculty: Faculty
    room: Room
    time_slot: TimeSlot
    division_id: Optional[int] = None
    division_name: Optional[str] = None
    
    def to_dict(self):
        return {
            'subject_name': self.subject.name,
            'subject_code': self.subject.code,
            'faculty_name': self.faculty.name,
            'room_name': self.room.name,
            'day': self.time_slot.day,
            'time': f"{self.time_slot.start_time}-{self.time_slot.end_time}",
            'division': self.division_name or 'N/A'
        }
    
    def has_conflict_with(self, other: 'ScheduleEntry') -> bool:
        """Check if this entry conflicts with another"""
        # Same time slot
        if self.time_slot.id != other.time_slot.id:
            return False
        
        # Faculty conflict
        if self.faculty.id == other.faculty.id:
            return True
        
        # Room conflict
        if self.room.id == other.room.id:
            return True
        
        # Division conflict
        if self.division_id and other.division_id and self.division_id == other.division_id:
            return True
        
        return False

class Schedule:
    def __init__(self):
        self.entries: List[ScheduleEntry] = []
        
    def add_entry(self, entry: ScheduleEntry):
        """Add entry and check for conflicts"""
        conflicts = self.check_conflicts(entry)
        if conflicts:
            print(f"⚠️ Warning: Adding entry with {len(conflicts)} conflicts")
        self.entries.append(entry)
        
    def check_conflicts(self, new_entry: ScheduleEntry) -> List[str]:
        """Check if new entry conflicts with existing entries"""
        conflicts = []
        for entry in self.entries:
            if entry.has_conflict_with(new_entry):
                conflicts.append(
                    f"Conflict at {new_entry.time_slot}: "
                    f"{new_entry.subject.name} vs {entry.subject.name}"
                )
        return conflicts
        
    def to_dict(self):
        return [entry.to_dict() for entry in self.entries]
    
    def get_conflicts_count(self) -> int:
        """Count total number of conflicts"""
        conflict_count = 0
        for i, entry1 in enumerate(self.entries):
            for entry2 in self.entries[i+1:]:
                if entry1.has_conflict_with(entry2):
                    conflict_count += 1
        return conflict_count
    
    def get_utilization_stats(self) -> Dict:
        """Get statistics about schedule utilization"""
        faculty_hours = {}
        room_usage = {}
        day_distribution = {}
        
        for entry in self.entries:
            # Faculty hours
            fid = entry.faculty.id
            faculty_hours[fid] = faculty_hours.get(fid, 0) + 1
            
            # Room usage
            rid = entry.room.id
            room_usage[rid] = room_usage.get(rid, 0) + 1
            
            # Day distribution
            day = entry.time_slot.day
            day_distribution[day] = day_distribution.get(day, 0) + 1
        
        return {
            'total_classes': len(self.entries),
            'faculty_hours': faculty_hours,
            'room_usage': room_usage,
            'day_distribution': day_distribution,
            'conflicts': self.get_conflicts_count()
        }

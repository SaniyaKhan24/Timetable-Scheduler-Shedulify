from dataclasses import dataclass
from typing import List, Optional
import json

@dataclass
class TimeSlot:
    id: int
    day: str
    start_time: str
    end_time: str
    
    def __str__(self):
        return f"{self.day} {self.start_time}-{self.end_time}"

@dataclass
class Room:
    id: int
    name: str
    capacity: int
    room_type: str  # 'lab', 'lecture', 'tutorial'
    
@dataclass
class Faculty:
    id: int
    name: str
    department: str
    max_hours_per_week: int
    available_slots: List[int]  # List of TimeSlot IDs
    available_days: List[str] = None  # NEW: List of day names
    available_time_slots: List[str] = None  # NEW: List of time ranges like "09:00-10:00"
    
    def __post_init__(self):
        if self.available_days is None:
            self.available_days = []
        if self.available_time_slots is None:
            self.available_time_slots = []

@dataclass
class Subject:
    id: int
    name: str
    code: str
    faculty_id: int
    hours_per_week: int
    room_type: str
    student_count: int

@dataclass
class ScheduleEntry:
    subject: Subject
    faculty: Faculty
    room: Room
    time_slot: TimeSlot
    
    def to_dict(self):
        return {
            'subject_name': self.subject.name,
            'subject_code': self.subject.code,
            'faculty_name': self.faculty.name,
            'room_name': self.room.name,
            'day': self.time_slot.day,
            'time': f"{self.time_slot.start_time}-{self.time_slot.end_time}"
        }

class Schedule:
    def __init__(self):
        self.entries: List[ScheduleEntry] = []
        
    def add_entry(self, entry: ScheduleEntry):
        self.entries.append(entry)
        
    def to_dict(self):
        return [entry.to_dict() for entry in self.entries]

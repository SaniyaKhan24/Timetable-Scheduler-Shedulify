import csv
import json
from typing import List, Dict
from dataclasses import asdict
from models import TimeSlot, Room, Faculty, Subject

class DataHandler:
    def __init__(self):
        self.time_slots: List[TimeSlot] = []
        self.rooms: List[Room] = []
        self.faculty: List[Faculty] = []
        self.subjects: List[Subject] = []
        
    def load_from_csv(self, filepath: str, entity_type: str):
        """Load data from CSV file"""
        with open(filepath, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            if entity_type == 'timeslots':
                self.time_slots = [
                    TimeSlot(int(row['id']), row['day'], row['start_time'], row['end_time'])
                    for row in reader
                ]
            elif entity_type == 'rooms':
                self.rooms = [
                    Room(int(row['id']), row['name'], int(row['capacity']), row['room_type'])
                    for row in reader
                ]
            elif entity_type == 'faculty':
                self.faculty = [
                    Faculty(
                        int(row['id']), row['name'], row['department'],
                        int(row['max_hours_per_week']),
                        json.loads(row['available_slots'])
                    )
                    for row in reader
                ]
            elif entity_type == 'subjects':
                self.subjects = [
                    Subject(
                        int(row['id']), row['name'], row['code'],
                        int(row['faculty_id']), int(row['hours_per_week']),
                        row['room_type'], int(row['student_count'])
                    )
                    for row in reader
                ]
    
    def load_from_dict(self, data: Dict, entity_type: str):
        """Load data from dictionary (from API)"""
        if entity_type == 'timeslots':
            self.time_slots = [TimeSlot(**item) for item in data]
        elif entity_type == 'rooms':
            self.rooms = [Room(**item) for item in data]
        elif entity_type == 'faculty':
            self.faculty = [Faculty(**item) for item in data]
        elif entity_type == 'subjects':
            self.subjects = [Subject(**item) for item in data]
    
    def get_all_data(self):
        """Return all loaded data"""
        return {
            'time_slots': self.time_slots,
            'rooms': self.rooms,
            'faculty': self.faculty,
            'subjects': self.subjects
        }
    
    def to_serializable(self):
        """Return all data as JSON-serializable dicts"""
        return {
            'time_slots': [asdict(ts) for ts in self.time_slots],
            'rooms': [asdict(r) for r in self.rooms],
            'faculty': [asdict(f) for f in self.faculty],
            'subjects': [asdict(s) for s in self.subjects],
        }
    
    def add_item(self, entity_type: str, item: Dict):
        """Add a new item"""
        print(f"[DataHandler] Adding {entity_type}: {item}")
        
        if entity_type == 'timeslots':
            next_id = max([ts.id for ts in self.time_slots], default=0) + 1
            item['id'] = item.get('id', next_id)
            ts = TimeSlot(**item)
            self.time_slots.append(ts)
            print(f"[DataHandler] Added timeslot {ts.id}. Total: {len(self.time_slots)}")
            return asdict(ts)
        
        elif entity_type == 'rooms':
            next_id = max([r.id for r in self.rooms], default=0) + 1
            item['id'] = item.get('id', next_id)
            room = Room(**item)
            self.rooms.append(room)
            print(f"[DataHandler] Added room {room.id}. Total: {len(self.rooms)}")
            return asdict(room)
        
        elif entity_type == 'faculty':
            next_id = max([f.id for f in self.faculty], default=0) + 1
            item['id'] = item.get('id', next_id)
            # Ensure available_slots is list
            if 'available_slots' in item:
                if isinstance(item['available_slots'], str):
                    item['available_slots'] = [int(x.strip()) for x in item['available_slots'].split(',') if x.strip()]
                elif not isinstance(item['available_slots'], list):
                    item['available_slots'] = []
            fac = Faculty(**item)
            self.faculty.append(fac)
            print(f"[DataHandler] Added faculty {fac.id}. Total: {len(self.faculty)}")
            return asdict(fac)
        
        elif entity_type == 'subjects':
            next_id = max([s.id for s in self.subjects], default=0) + 1
            item['id'] = item.get('id', next_id)
            sub = Subject(**item)
            self.subjects.append(sub)
            print(f"[DataHandler] Added subject {sub.id}. Total: {len(self.subjects)}")
            return asdict(sub)
        
        raise ValueError(f'Unknown entity type: {entity_type}')
    
    def delete_item(self, entity_type: str, item_id: int) -> bool:
        """Delete an item by ID"""
        print(f"[DataHandler] Deleting {entity_type} id={item_id}")
        
        if entity_type == 'timeslots':
            original_len = len(self.time_slots)
            self.time_slots = [ts for ts in self.time_slots if ts.id != item_id]
            success = len(self.time_slots) < original_len
            print(f"[DataHandler] Delete timeslot: {success}. Total: {len(self.time_slots)}")
            return success
        
        elif entity_type == 'rooms':
            original_len = len(self.rooms)
            self.rooms = [r for r in self.rooms if r.id != item_id]
            success = len(self.rooms) < original_len
            print(f"[DataHandler] Delete room: {success}. Total: {len(self.rooms)}")
            return success
        
        elif entity_type == 'faculty':
            original_len = len(self.faculty)
            self.faculty = [f for f in self.faculty if f.id != item_id]
            success = len(self.faculty) < original_len
            print(f"[DataHandler] Delete faculty: {success}. Total: {len(self.faculty)}")
            return success
        
        elif entity_type == 'subjects':
            original_len = len(self.subjects)
            self.subjects = [s for s in self.subjects if s.id != item_id]
            success = len(self.subjects) < original_len
            print(f"[DataHandler] Delete subject: {success}. Total: {len(self.subjects)}")
            return success
        
        return False

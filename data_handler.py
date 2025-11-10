import csv
import json
from typing import List, Dict, Optional
from dataclasses import asdict
from models import TimeSlot, Room, Faculty, Subject

class DataHandler:
    def __init__(self):
        self.time_slots: List[TimeSlot] = []
        self.rooms: List[Room] = []
        self.faculty: List[Faculty] = []
        self.subjects: List[Subject] = []
        
    def load_from_csv(self, filepath: str, entity_type: str):
        """Load data from CSV file with error handling"""
        try:
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
                            json.loads(row.get('available_slots', '[]')),
                            json.loads(row.get('available_days', '[]')),
                            json.loads(row.get('available_time_slots', '[]'))
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
                print(f"✅ Loaded {len(getattr(self, entity_type))} {entity_type} from CSV")
        except FileNotFoundError:
            print(f"⚠️ File not found: {filepath}")
        except Exception as e:
            print(f"❌ Error loading {entity_type}: {e}")
    
    def load_from_dict(self, data: List[Dict], entity_type: str):
        """Load data from dictionary with validation"""
        try:
            if entity_type == 'timeslots':
                self.time_slots = [TimeSlot(**item) for item in data]
            elif entity_type == 'rooms':
                self.rooms = [Room(**item) for item in data]
            elif entity_type == 'faculty':
                self.faculty = [Faculty(**item) for item in data]
            elif entity_type == 'subjects':
                self.subjects = [Subject(**item) for item in data]
            print(f"✅ Loaded {len(data)} {entity_type} from dict")
        except Exception as e:
            print(f"❌ Error loading {entity_type} from dict: {e}")
    
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
        """Add a new item with validation"""
        print(f"[DataHandler] Adding {entity_type}: {item}")
        
        try:
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
                # Ensure available_days is list
                if 'available_days' not in item:
                    item['available_days'] = []
                # Ensure available_time_slots is dict or list
                if 'available_time_slots' not in item:
                    item['available_time_slots'] = {}
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
        except Exception as e:
            print(f"❌ Error adding {entity_type}: {e}")
            raise
    
    def update_item(self, entity_type: str, item_id: int, updates: Dict) -> Optional[Dict]:
        """Update an existing item"""
        print(f"[DataHandler] Updating {entity_type} id={item_id} with {updates}")
        
        try:
            if entity_type == 'timeslots':
                for i, ts in enumerate(self.time_slots):
                    if ts.id == item_id:
                        for key, value in updates.items():
                            setattr(ts, key, value)
                        print(f"[DataHandler] Updated timeslot {item_id}")
                        return asdict(ts)
            
            elif entity_type == 'rooms':
                for i, r in enumerate(self.rooms):
                    if r.id == item_id:
                        for key, value in updates.items():
                            setattr(r, key, value)
                        print(f"[DataHandler] Updated room {item_id}")
                        return asdict(r)
            
            elif entity_type == 'faculty':
                for i, f in enumerate(self.faculty):
                    if f.id == item_id:
                        for key, value in updates.items():
                            setattr(f, key, value)
                        print(f"[DataHandler] Updated faculty {item_id}")
                        return asdict(f)
            
            elif entity_type == 'subjects':
                for i, s in enumerate(self.subjects):
                    if s.id == item_id:
                        for key, value in updates.items():
                            setattr(s, key, value)
                        print(f"[DataHandler] Updated subject {item_id}")
                        return asdict(s)
            
            print(f"⚠️ Item not found: {entity_type} id={item_id}")
            return None
        except Exception as e:
            print(f"❌ Error updating {entity_type}: {e}")
            return None
    
    def delete_item(self, entity_type: str, item_id: int) -> bool:
        """Delete an item by ID with validation"""
        print(f"[DataHandler] Deleting {entity_type} id={item_id}")
        
        try:
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
        except Exception as e:
            print(f"❌ Error deleting {entity_type}: {e}")
            return False
    
    def validate_data(self) -> List[str]:
        """Validate loaded data and return list of errors"""
        errors = []
        
        if not self.time_slots:
            errors.append("No time slots defined")
        
        if not self.rooms:
            errors.append("No rooms defined")
        
        if not self.faculty:
            errors.append("No faculty members defined")
        
        if not self.subjects:
            errors.append("No subjects defined")
        
        # Check for faculty without availability
        for fac in self.faculty:
            if not fac.available_days or not fac.available_time_slots:
                errors.append(f"Faculty {fac.name} has no availability set")
        
        return errors

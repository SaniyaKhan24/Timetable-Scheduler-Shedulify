"""Test script to verify backend functionality"""
import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_add_timeslot():
    print("\n=== Testing Add Time Slot ===")
    data = {
        "type": "timeslots",
        "item": {
            "day": "Monday",
            "start_time": "09:00",
            "end_time": "10:00"
        }
    }
    response = requests.post(f"{BASE_URL}/data/add", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.json()

def test_list_timeslots():
    print("\n=== Testing List Time Slots ===")
    response = requests.get(f"{BASE_URL}/data/list/time_slots")
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.json()

def test_add_room():
    print("\n=== Testing Add Room ===")
    data = {
        "type": "rooms",
        "item": {
            "name": "Room 101",
            "capacity": 50,
            "room_type": "lecture"
        }
    }
    response = requests.post(f"{BASE_URL}/data/add", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.json()

def test_add_faculty():
    print("\n=== Testing Add Faculty ===")
    data = {
        "type": "faculty",
        "item": {
            "name": "Dr. Smith",
            "department": "CS",
            "max_hours_per_week": 20,
            "available_slots": [1]
        }
    }
    response = requests.post(f"{BASE_URL}/data/add", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.json()

def test_add_subject():
    print("\n=== Testing Add Subject ===")
    data = {
        "type": "subjects",
        "item": {
            "name": "Data Structures",
            "code": "CS201",
            "faculty_id": 1,
            "hours_per_week": 4,
            "room_type": "lecture",
            "student_count": 50
        }
    }
    response = requests.post(f"{BASE_URL}/data/add", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return response.json()

if __name__ == "__main__":
    print("🧪 Starting Backend Tests")
    print("="*50)
    
    try:
        # Test each endpoint
        test_add_timeslot()
        test_list_timeslots()
        test_add_room()
        test_add_faculty()
        test_add_subject()
        
        print("\n" + "="*50)
        print("✅ All tests completed!")
        print("If you see successful responses above, backend is working.")
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to Flask server!")
        print("Make sure Flask is running: python app.py")
    except Exception as e:
        print(f"\n❌ ERROR: {e}")

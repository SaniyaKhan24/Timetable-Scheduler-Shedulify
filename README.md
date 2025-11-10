# Schedulify - Automatic Timetable Generation System

An AI-powered timetable scheduling system that uses Genetic Algorithms and Backtracking to generate optimal class schedules automatically.


<<<<<<< HEAD

## Architecture

### Frontend (JavaScript)
- **app.js** - Core functions: data management, rendering, modals, CRUD operations
- **dashboard.js** - Dashboard-specific logic: backend API calls, timetable generation
- Stores data in localStorage for persistence
- Makes POST requests to backend for timetable generation

### Backend (Python/Flask)
- **app.py** - REST API endpoints, request handling
- **genetic_algorithm.py** - Genetic Algorithm implementation
- **backtracking.py** - Constraint Satisfaction implementation (alternative algorithm)
- SQLite database for data persistence

### Generation Flow
1. User clicks "Generate Timetable" in frontend
2. `dashboard.js` calls `POST /api/timetable/generate` with parameters
3. Flask receives request in `app.py`
4. `genetic_algorithm.py` fetches data from SQLite
5. Creates population of 50 random timetables
6. Evolves through 100 generations using:
   - Tournament selection
   - Single-point crossover
   - Random mutation
   - Elitism (top 10%)
7. Fitness function penalizes conflicts:
   - Faculty double-booking (-10 points)
   - Room clashes (-10 points)
   - Availability violations
   - Uneven distribution
8. Returns best timetable as JSON
9. Frontend displays schedule in day-wise grid

## Features

- **Conflict-Free Scheduling** - Genetic Algorithm actively prevents faculty and room double-booking
- **Backend-Powered Generation** - Uses Python Genetic Algorithm (not local JavaScript)
- **Constraint Satisfaction** - Validates faculty availability, room capacity, and subject requirements
- **Multi-objective Fitness** - Optimizes for zero conflicts and even distribution
- **Automatic Conflict Detection** - Reports any remaining conflicts with details
- **Faculty, Subject, Room, Timeslot Management** - Full CRUD operations
- **Responsive Web Interface** - Glassmorphism design with modal forms
- **Local Storage** - Data persistence across sessions
- **Schedule Export** - Download as CSV and print functionality
- **Validation Reports** - Comprehensive conflict analysis and resource utilization
=======

## Features

- Genetic Algorithm optimization for large-scale scheduling
- Backtracking algorithm for constraint satisfaction
- Multi-objective fitness evaluation
- Automatic conflict detection and resolution
- Faculty, subject, room, and timeslot management
- Responsive web interface with glassmorphism design
- Local storage for data persistence
- Schedule export and print functionality
>>>>>>> e2a89f520c164a2ea21ec56b309013564111d17a

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
<<<<<<< HEAD
- Modern web browser (Chrome, Firefox, Edge recommended)
=======
- Modern web browser
>>>>>>> e2a89f520c164a2ea21ec56b309013564111d17a

## Installation

1. Clone the repository
```bash
git clone https://github.com/SaniyaKhan24/Timetable-Scheduler-Shedulify.git
cd Timetable-Scheduler-Shedulify
```

2. Install Python dependencies
```bash
pip install -r requirements.txt
```

3. Initialize the database
```bash
python init_db.py
```

4. Run the Flask server
```bash
python app.py
```

5. Access the application at `http://localhost:5000`

## Usage

### Data Setup
1. Navigate to the Dashboard
2. **Add Time Slots First** - Define your working hours (e.g., 8:00 AM - 3:00 PM)
3. Add faculty members with:
   - Available days (checkboxes)
   - Available time slots (specific hours)
   - Maximum teaching hours per week
   - Subjects they can teach
4. Add subjects with course codes and types (Theory/Lab/Practical)
5. Add rooms with capacity and facilities
2. Add faculty members with availability and teaching hours
3. Add subjects with course codes and types (Theory/Lab/Practical)
4. Add rooms with capacity and facilities
5. Add time slots for scheduling
6. Create divisions and assign subjects

### Generate Timetable
1. Click "Generate Timetable"
2. Select a division
3. Configure parameters (optional):
   - Population Size: 10-500 (default: 50)
   - Generations: 10-1000 (default: 100)
   - Mutation Rate: 0.01-1.0 (default: 0.1)
4. Click "Generate"
5. Backend Genetic Algorithm processes the request
6. Review the validation report:
   - Fitness score
   - Conflict count
   - Generation history

### Conflict Resolution
- The Genetic Algorithm automatically:
  - Prevents faculty from teaching multiple classes simultaneously
  - Prevents double-booking of rooms
  - Respects faculty availability constraints
  - Balances faculty workload
  - Distributes classes evenly across the week
2. Configure parameters:
   - Population Size: 10-500 (default: 50)
   - Generations: 10-1000 (default: 100)
   - Mutation Rate: 0.01-1.0 (default: 0.1)
3. Select algorithm (Genetic/Backtracking) or compare both
4. View generated schedule with fitness scores

## Project Structure

```
PBL/
├── static/
│   ├── index.html
│   ├── dashboard.html
│   ├── style.css
│   ├── app.js
│   └── dashboard.js
├── app.py
├── genetic_algorithm.py
├── backtracking.py
├── data_handler.py
├── models.py
├── init_db.py
├── requirements.txt
└── README.md
```

## Algorithms

### Genetic Algorithm
- Population-based evolutionary optimization
- **Fitness function** evaluates conflict count and resource distribution
- Tournament selection with elitism
- Single-point crossover
- Random mutation
- Suitable for large datasets with near-optimal solutions

<<<<<<< HEAD
### Constraint Satisfaction (New)
- **Resource Tracking** - Monitors faculty and room availability globally
- **Sequential Scheduling** - Schedules divisions one by one to prevent conflicts
- **Backtracking** - Retries failed assignments with alternative resources
- **Priority-based** - Schedules larger divisions or lab-heavy courses first
- Guaranteed conflict-free solutions when feasible

## Performance

**Conflict-Free Generation:**
- Small Dataset (1-3 divisions): < 2 seconds
- Medium Dataset (4-6 divisions): 3-8 seconds  
- Large Dataset (7+ divisions): 8-20 seconds

### Backtracking
- Exhaustive search with constraint propagation
- Guaranteed conflict-free solutions
- Suitable for small datasets requiring perfect solutions

## API Endpoints

### Data Management
- `GET /api/data/list/<entity_type>` - List items
- `POST /api/data/add` - Add new item
- `POST /api/data/delete` - Delete item

### Timetable Generation
- `POST /generate-timetable` - Generate with specific algorithm
- `POST /compare-algorithms` - Compare both algorithms

## Performance
**Genetic Algorithm:**
- Small Dataset (5-10 subjects): < 1 second
- Medium Dataset (20-30 subjects): 2-5 seconds
- Large Dataset (50+ subjects): 5-15 seconds

<<<<<<< HEAD
## Troubleshooting

**No schedule generated:** 
- Ensure all required data is added
- Verify faculty availability matches configured time slots
- Check that faculty members are assigned to subjects and divisions

**Too many conflicts:** 
- Add more rooms or time slots
- Increase faculty availability windows
- Reduce subjects per division

**Partial schedules:**
- Some subjects couldn't be scheduled due to constraints
- Review unmet requirements in validation report
- Add more faculty or relax availability constraints
**Backtracking:**
- Small Dataset (5-10 subjects): 1-5 seconds
- Medium Dataset (20-30 subjects): 10-60 seconds
- Large Dataset (50+ subjects): May timeout

## Troubleshooting

**No schedule generated:** Ensure all required data is added and faculty availability matches time slots

**Too many conflicts:** Increase generations, add more rooms/time slots, or try backtracking algorithm

**Server not responding:** Verify Flask server is running on port 5000

## Author

Saniya Khan - https://github.com/SaniyaKhan24

## Contact

Email: saniyajkhan24@gmail.com
Project: https://github.com/SaniyaKhan24/Timetable-Scheduler-Shedulify.git

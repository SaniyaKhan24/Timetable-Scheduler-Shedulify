# Schedulify - Automatic Timetable Generation System

An AI-powered timetable scheduling system that uses Genetic Algorithms and Backtracking to generate optimal class schedules automatically.

## Features

- Genetic Algorithm optimization for large-scale scheduling
- Backtracking algorithm for constraint satisfaction
- Multi-objective fitness evaluation
- Automatic conflict detection and resolution
- Faculty, subject, room, and timeslot management
- Responsive web interface with glassmorphism design
- Local storage for data persistence
- Schedule export and print functionality

## Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Modern web browser

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
2. Add faculty members with availability and teaching hours
3. Add subjects with course codes and types (Theory/Lab/Practical)
4. Add rooms with capacity and facilities
5. Add time slots for scheduling
6. Create divisions and assign subjects

### Generate Timetable
1. Click "Generate Timetable"
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
- Tournament selection with elitism
- Single-point crossover
- Random mutation
- Suitable for large datasets with near-optimal solutions

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

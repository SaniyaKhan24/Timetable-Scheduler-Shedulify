# 📅 Schedulify - Automatic Timetable Generation System

![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![Flask](https://img.shields.io/badge/flask-2.0+-green.svg)

An intelligent AI-powered timetable scheduling system that uses **Genetic Algorithms** and **Backtracking** to generate optimal class schedules automatically. Eliminates conflicts, maximizes efficiency, and saves hours of manual planning.

## 🌟 Features

### Core Functionality
- **🧬 Genetic Algorithm Optimization**: Population-based evolutionary approach for finding optimal schedules
- **🔙 Backtracking Algorithm**: Constraint satisfaction with exhaustive search for guaranteed conflict-free solutions
- **⚖️ Algorithm Comparison**: Compare both algorithms side-by-side to find the best solution
- **🎯 Multi-Objective Fitness**: Evaluates schedules based on conflicts, distribution, and constraints
- **🚫 Conflict Detection**: Automatically detects and resolves faculty, room, and time conflicts

### Management Features
- **👥 Faculty Management**: Track faculty members, departments, availability, and teaching hours
- **📚 Subject Management**: Organize courses with codes, credits, types (Theory/Lab/Practical)
- **🏫 Room Management**: Manage classrooms, labs, capacity, and facilities
- **⏰ Time Slot Management**: Define flexible scheduling slots across weekdays
- **🎓 Division Management**: Handle multiple student divisions and their subject assignments

### User Interface
- **🎨 Modern Glassmorphism UI**: Beautiful gradient backgrounds with frosted glass effects
- **📱 Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **🌓 Dark/Light Mode**: Automatic theme switching based on system preferences
- **📊 Visual Analytics**: Fitness evolution charts and schedule visualization
- **💾 Local Storage**: Persistent data storage in browser
- **📥 Export/Print**: Download and print generated timetables

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/schedulify.git
cd schedulify
```

2. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

3. **Initialize the database**
```bash
python init_db.py
```

4. **Run the Flask server**
```bash
python app.py
```

5. **Access the application**
```
Open your browser and navigate to: http://localhost:5000
```

## 📖 User Guide

### Getting Started

1. **Add Basic Data**
   - Navigate to the Dashboard
   - Add Faculty members with their availability
   - Add Subjects with course details
   - Add Rooms with capacity and type
   - Add Time Slots for scheduling

2. **Create Divisions**
   - Go to the Divisions tab
   - Create student divisions (e.g., A, B, C)
   - Assign subjects to each division
   - Specify student count

3. **Generate Timetable**
   - Click "Generate Timetable"
   - Configure algorithm parameters:
     - **Population Size**: Number of candidate schedules (10-500)
     - **Generations**: Evolution iterations (10-1000)
     - **Mutation Rate**: Probability of changes (0.01-1.0)
   - Click "Generate Schedule"
   - View results with fitness scores and conflict detection

4. **View & Export**
   - View generated timetables in the Timetables tab
   - Click "View Details" to see the full schedule
   - Export to CSV or print directly

### Algorithm Selection

#### Genetic Algorithm
- **Best for**: Large datasets, flexible solutions
- **Speed**: Fast (completes in seconds)
- **Quality**: Near-optimal solutions (80-100% fitness)
- **Conflicts**: May have minor conflicts that can be manually adjusted

#### Backtracking
- **Best for**: Small datasets, perfect solutions required
- **Speed**: Slower (may take minutes for large datasets)
- **Quality**: Perfect solutions (100% fitness)
- **Conflicts**: Zero conflicts guaranteed

#### Compare Both
- Runs both algorithms simultaneously
- Shows comparison results
- Automatically selects the best solution
- Recommended for finding the optimal approach for your data

## 🏗️ Project Structure

```
PBL/
├── static/                      # Frontend files
│   ├── index.html              # Landing page
│   ├── dashboard.html          # Main application dashboard
│   ├── style.css               # Global styles with glassmorphism
│   ├── app.js                  # Frontend logic and data management
│   ├── dashboard.js            # Timetable generation logic
│   └── components/             # Reusable UI components
│       ├── header.html         # Site header
│       └── footer.html         # Site footer
│
├── app.py                      # Flask backend server
├── genetic_algorithm.py        # Genetic Algorithm implementation
├── backtracking.py             # Backtracking Algorithm implementation
├── data_handler.py             # Data management and persistence
├── models.py                   # Data models (Subject, Faculty, etc.)
├── init_db.py                  # Database initialization script
├── timetable.db               # SQLite database
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

## 🧬 Algorithm Details

### Genetic Algorithm

**Overview**: Evolutionary optimization inspired by natural selection.

**Steps**:
1. **Initialization**: Create random population of schedules
2. **Fitness Evaluation**: Score each schedule based on constraints
3. **Selection**: Choose best schedules using tournament selection
4. **Crossover**: Combine two parent schedules to create offspring
5. **Mutation**: Randomly modify genes to maintain diversity
6. **Iteration**: Repeat for specified generations

**Fitness Function**:
```python
fitness_score = 100
- (faculty_conflicts × 10)
- (room_conflicts × 10)
- (distribution_variance × 2)
```

**Parameters**:
- `population_size`: 10-500 (default: 50)
- `generations`: 10-1000 (default: 100)
- `mutation_rate`: 0.01-1.0 (default: 0.1)
- `crossover_rate`: 0.5-0.9 (default: 0.7)

### Backtracking Algorithm

**Overview**: Systematic exhaustive search with constraint propagation.

**Steps**:
1. **Assignment**: Try assigning a subject to a time slot
2. **Constraint Check**: Verify no conflicts (faculty, room, time)
3. **Recursion**: If valid, proceed to next subject
4. **Backtrack**: If invalid, undo and try alternative
5. **Solution**: Return first valid complete schedule

**Constraints**:
- Faculty availability on specific days and time slots
- Room capacity matching student count
- No double-booking of faculty or rooms
- Lab subjects assigned to lab rooms

## 🛠️ API Documentation

### Base URL
```
http://localhost:5000/api
```

### Endpoints

#### Data Management

**List Items**
```http
GET /api/data/list/<entity_type>
```
Entity types: `subjects`, `faculty`, `rooms`, `timeslots`, `divisions`

**Add Item**
```http
POST /api/data/add
Content-Type: application/json

{
  "type": "subjects",
  "item": {
    "code": "CS101",
    "name": "Data Structures",
    "hours": 3,
    "type": "theory"
  }
}
```

**Delete Item**
```http
POST /api/data/delete
Content-Type: application/json

{
  "type": "subjects",
  "id": 1
}
```

#### Timetable Generation

**Generate with Specific Algorithm**
```http
POST /generate-timetable
Content-Type: application/json

{
  "algorithm": "genetic"  // or "backtracking"
}
```

**Compare Algorithms**
```http
POST /compare-algorithms
Content-Type: application/json
```

**Response Format**
```json
{
  "success": true,
  "algorithm": "Genetic Algorithm",
  "fitness_score": 95.5,
  "conflicts": [],
  "schedule": [
    {
      "day": "Monday",
      "start_time": "09:00",
      "end_time": "10:00",
      "subject": "Data Structures",
      "subject_code": "CS101",
      "faculty": "Dr. John Smith",
      "room": "201"
    }
  ],
  "generated_at": "2024-01-15T10:30:00"
}
```

## 🎨 Customization

### Styling

The application uses CSS custom properties for easy theming:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  --accent: oklch(0.97 0 0);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: oklch(0.145 0 0);
    --foreground: oklch(0.985 0 0);
  }
}
```

### Algorithm Parameters

Modify in `genetic_algorithm.py`:
```python
self.population_size = 50
self.generations = 100
self.mutation_rate = 0.1
self.crossover_rate = 0.7
```

## 📊 Performance

### Genetic Algorithm
- **Small Dataset** (5-10 subjects): < 1 second
- **Medium Dataset** (20-30 subjects): 2-5 seconds
- **Large Dataset** (50+ subjects): 5-15 seconds

### Backtracking
- **Small Dataset** (5-10 subjects): 1-5 seconds
- **Medium Dataset** (20-30 subjects): 10-60 seconds
- **Large Dataset** (50+ subjects): May timeout

### Optimization Tips
- Start with genetic algorithm for large datasets
- Use backtracking for small, critical schedules
- Reduce population size or generations for faster results
- Increase mutation rate if stuck in local optima

## 🐛 Troubleshooting

### Common Issues

**"No schedule generated"**
- Ensure all required data is added (subjects, faculty, rooms, timeslots)
- Check faculty availability matches time slots
- Verify room capacity is sufficient for divisions

**"Too many conflicts"**
- Increase number of generations
- Add more rooms or time slots
- Adjust faculty availability
- Try backtracking algorithm

**"Server not responding"**
- Check if Flask server is running: `python app.py`
- Verify port 5000 is not in use
- Check browser console for errors

**"Data not persisting"**
- Data is stored in browser localStorage
- Clear browser cache may delete data
- Use export feature to backup important schedules

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 👥 Authors

- **Saniya Khan** - *Initial work* - https://github.com/SaniyaKhan24

## 🙏 Acknowledgments

- Genetic Algorithm concepts from "Artificial Intelligence: A Modern Approach"
- Backtracking implementation inspired by CSP solving techniques
- UI design influenced by modern glassmorphism trends
- Icons from Font Awesome
- Gradient inspirations from various design resources

## 📧 Contact

- **Email**: saniyajkhan24@gmail.com
- **Project Link**: https://github.com/SaniyaKhan24/Timetable-Scheduler-Shedulify.git

## 🔮 Future Enhancements

- [ ] Multi-campus support
- [ ] Teacher preferences and constraints
- [ ] Student elective handling
- [ ] Mobile app (React Native)
- [ ] Real-time collaboration
- [ ] Integration with university ERP systems
- [ ] Advanced analytics and reporting
- [ ] Machine learning for pattern recognition
- [ ] Calendar export (iCal, Google Calendar)
- [ ] Email notifications for schedule changes

---

**Made with ❤️ for educational institutions worldwide**

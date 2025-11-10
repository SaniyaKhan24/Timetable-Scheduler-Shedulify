import random
import copy
from typing import List, Dict, Tuple

class TimetableGene:
    """Represents a single class assignment"""
    def __init__(self, division_id, subject_id, faculty_id, room_id, timeslot_id):
        self.division_id = division_id
        self.subject_id = subject_id
        self.faculty_id = faculty_id
        self.room_id = room_id
        self.timeslot_id = timeslot_id

class Timetable:
    """Represents a complete timetable (chromosome)"""
    def __init__(self, genes: List[TimetableGene] = None):
        self.genes = genes or []
        self.fitness = 0
        self.conflicts = []
    
    def calculate_fitness(self, subjects, faculty, rooms, timeslots, divisions):
        """Calculate fitness score (higher is better)"""
        score = 1000
        self.conflicts = []
        
        # Track usage for conflict detection
        faculty_usage = {}  # {faculty_id: {timeslot_id: True}}
        room_usage = {}     # {room_id: {timeslot_id: True}}
        division_usage = {} # {division_id: {timeslot_id: True}}
        
        # Track hours assigned per subject per division
        subject_hours = {}  # {(division_id, subject_id): count}
        
        for gene in self.genes:
            slot = next((t for t in timeslots if t['id'] == gene.timeslot_id), None)
            if not slot:
                score -= 50
                self.conflicts.append(f"Invalid timeslot ID {gene.timeslot_id}")
                continue
            
            slot_day = slot['day']
            slot_time = f"{slot['start_time']}-{slot['end_time']}"
            
            # Track subject hours
            key = (gene.division_id, gene.subject_id)
            subject_hours[key] = subject_hours.get(key, 0) + 1
            
            # Check faculty availability (CRITICAL)
            fac = next((f for f in faculty if f['id'] == gene.faculty_id), None)
            if fac:
                # Hard constraint: Faculty must be available on this day
                if slot_day not in fac.get('available_days', []):
                    score -= 100  # Increased penalty
                    self.conflicts.append(f"Faculty {fac['name']} not available on {slot_day}")
                
                # Hard constraint: Faculty must be available at this time
                day_slots = fac.get('available_time_slots', {}).get(slot_day, [])
                if slot_time not in day_slots:
                    score -= 100  # Increased penalty
                    self.conflicts.append(f"Faculty {fac['name']} not available at {slot_time} on {slot_day}")
                
                # Hard constraint: Faculty can only teach assigned subjects
                if gene.subject_id not in fac.get('subjects', []):
                    score -= 150  # Very high penalty
                    self.conflicts.append(f"Faculty {fac['name']} not assigned to subject {gene.subject_id}")
                
                # Hard constraint: Faculty can only teach assigned divisions
                if gene.division_id not in fac.get('divisions', []):
                    score -= 150  # Very high penalty
                    self.conflicts.append(f"Faculty {fac['name']} not assigned to division {gene.division_id}")
            
            # Check faculty double booking (CRITICAL - should never happen)
            if gene.faculty_id not in faculty_usage:
                faculty_usage[gene.faculty_id] = {}
            if gene.timeslot_id in faculty_usage[gene.faculty_id]:
                score -= 500  # Extremely high penalty
                self.conflicts.append(f"CRITICAL: Faculty {gene.faculty_id} double-booked at slot {gene.timeslot_id}")
            faculty_usage[gene.faculty_id][gene.timeslot_id] = True
            
            # Check room double booking (CRITICAL)
            if gene.room_id not in room_usage:
                room_usage[gene.room_id] = {}
            if gene.timeslot_id in room_usage[gene.room_id]:
                score -= 500  # Extremely high penalty
                self.conflicts.append(f"CRITICAL: Room {gene.room_id} double-booked at slot {gene.timeslot_id}")
            room_usage[gene.room_id][gene.timeslot_id] = True
            
            # Check division double booking (CRITICAL)
            if gene.division_id not in division_usage:
                division_usage[gene.division_id] = {}
            if gene.timeslot_id in division_usage[gene.division_id]:
                score -= 500  # Extremely high penalty
                self.conflicts.append(f"CRITICAL: Division {gene.division_id} has conflicting classes at slot {gene.timeslot_id}")
            division_usage[gene.division_id][gene.timeslot_id] = True
            
            # Check room capacity
            room = next((r for r in rooms if r['id'] == gene.room_id), None)
            division = next((d for d in divisions if d['id'] == gene.division_id), None)
            if room and division:
                if room['capacity'] < division['student_count']:
                    score -= 30
                    self.conflicts.append(f"Room {room['number']} (capacity {room['capacity']}) too small for division {division['name']} ({division['student_count']} students)")
        
        # Check subject hour requirements
        for division in divisions:
            div_subjects = [s for s in subjects if s['id'] in division['subjects']]
            for subject in div_subjects:
                key = (division['id'], subject['id'])
                actual_hours = subject_hours.get(key, 0)
                required_hours = subject['hours_per_week']
                
                if actual_hours != required_hours:
                    diff = abs(actual_hours - required_hours)
                    score -= diff * 20
                    self.conflicts.append(f"Subject {subject['name']} in {division['name']}: {actual_hours}/{required_hours} hours")
        
        # Bonus for even distribution of classes across days
        day_distribution = {}
        for gene in self.genes:
            slot = next((t for t in timeslots if t['id'] == gene.timeslot_id), None)
            if slot:
                day_distribution[slot['day']] = day_distribution.get(slot['day'], 0) + 1
        
        if day_distribution:
            avg_classes_per_day = sum(day_distribution.values()) / len(day_distribution)
            variance = sum((count - avg_classes_per_day) ** 2 for count in day_distribution.values()) / len(day_distribution)
            score += max(0, 50 - variance)
        
        self.fitness = max(0, score)
        return self.fitness

class GeneticAlgorithm:
    def __init__(self):
        self.population_size = 50
        self.generations = 100
        self.mutation_rate = 0.15
        self.crossover_rate = 0.8
        self.elitism_rate = 0.1
    
    def create_random_timetable(self, subjects, faculty, rooms, timeslots, divisions) -> Timetable:
        """Create a random but valid timetable"""
        genes = []
        missing_assignments = []
        # For each division
        for division in divisions:
            division_subjects = [s for s in subjects if s['id'] in division['subjects']]
            
            # For each subject assigned to this division
            for subject in division_subjects:
                # Get faculty who can teach this subject to this division
                eligible_faculty = [
                    f for f in faculty 
                    if subject['id'] in f.get('subjects', []) 
                    and division['id'] in f.get('divisions', [])
                ]
                if not eligible_faculty:
                    # Track missing assignment for diagnostics
                    missing_assignments.append(
                        f"No eligible faculty for subject '{subject.get('name', subject['id'])}' in division '{division.get('name', division['id'])}'"
                    )
                    continue
                # Assign classes for hours_per_week
                hours_needed = subject['hours_per_week']
                for _ in range(hours_needed):
                    # Pick a random eligible faculty
                    selected_faculty = random.choice(eligible_faculty)
                    
                    # Pick a timeslot where faculty is available
                    available_slots = []
                    for timeslot in timeslots:
                        slot_day = timeslot['day']
                        slot_time = f"{timeslot['start_time']}-{timeslot['end_time']}"
                        
                        if (slot_day in selected_faculty.get('available_days', []) and
                            slot_time in selected_faculty.get('available_time_slots', {}).get(slot_day, [])):
                            available_slots.append(timeslot)
                    
                    if not available_slots:
                        # Fallback: use any timeslot
                        available_slots = timeslots
                    
                    selected_timeslot = random.choice(available_slots)
                    selected_room = random.choice(rooms)
                    
                    gene = TimetableGene(
                        division['id'],
                        subject['id'],
                        selected_faculty['id'],
                        selected_room['id'],
                        selected_timeslot['id']
                    )
                    genes.append(gene)
        timetable = Timetable(genes)
        timetable.conflicts.extend(missing_assignments)
        return timetable
    
    def initialize_population(self, subjects, faculty, rooms, timeslots, divisions) -> List[Timetable]:
        """Create initial population"""
        population = []
        for _ in range(self.population_size):
            timetable = self.create_random_timetable(subjects, faculty, rooms, timeslots, divisions)
            timetable.calculate_fitness(subjects, faculty, rooms, timeslots, divisions)
            population.append(timetable)
        return population
    
    def selection(self, population: List[Timetable]) -> Tuple[Timetable, Timetable]:
        """Tournament selection"""
        tournament_size = 5
        tournament = random.sample(population, min(tournament_size, len(population)))
        tournament.sort(key=lambda x: x.fitness, reverse=True)
        return tournament[0], tournament[1] if len(tournament) > 1 else tournament[0]
    
    def crossover(self, parent1: Timetable, parent2: Timetable) -> Tuple[Timetable, Timetable]:
        """Single point crossover"""
        if random.random() > self.crossover_rate or len(parent1.genes) < 2:
            return copy.deepcopy(parent1), copy.deepcopy(parent2)
        
        point = random.randint(1, len(parent1.genes) - 1)
        
        child1_genes = copy.deepcopy(parent1.genes[:point] + parent2.genes[point:])
        child2_genes = copy.deepcopy(parent2.genes[:point] + parent1.genes[point:])
        
        return Timetable(child1_genes), Timetable(child2_genes)
    
    def mutate(self, timetable: Timetable, subjects, faculty, rooms, timeslots, divisions):
        """Intelligent mutation"""
        for i, gene in enumerate(timetable.genes):
            if random.random() < self.mutation_rate:
                mutation_type = random.choice(['faculty', 'room', 'timeslot'])
                
                if mutation_type == 'faculty':
                    # Only pick faculty who can teach this subject to this division
                    eligible = [
                        f for f in faculty 
                        if gene.subject_id in f.get('subjects', [])
                        and gene.division_id in f.get('divisions', [])
                    ]
                    if eligible:
                        gene.faculty_id = random.choice(eligible)['id']
                
                elif mutation_type == 'room':
                    gene.room_id = random.choice(rooms)['id']
                
                else:  # timeslot
                    # Try to pick a timeslot where faculty is available
                    fac = next((f for f in faculty if f['id'] == gene.faculty_id), None)
                    if fac:
                        available_slots = []
                        for ts in timeslots:
                            slot_day = ts['day']
                            slot_time = f"{ts['start_time']}-{ts['end_time']}"
                            if (slot_day in fac.get('available_days', []) and
                                slot_time in fac.get('available_time_slots', {}).get(slot_day, [])):
                                available_slots.append(ts)
                        
                        if available_slots:
                            gene.timeslot_id = random.choice(available_slots)['id']
                        else:
                            gene.timeslot_id = random.choice(timeslots)['id']
    
    def evolve(self, subjects, faculty, rooms, timeslots, divisions, progress_callback=None):
        """Main GA evolution"""
        
        if not subjects or not faculty or not rooms or not timeslots or not divisions:
            raise Exception("Insufficient data to generate timetable")
        
        # Initialize population
        population = self.initialize_population(subjects, faculty, rooms, timeslots, divisions)
        
        best_timetable = None
        best_fitness = -float('inf')
        generation_history = []
        
        for generation in range(self.generations):
            # Evaluate fitness
            for timetable in population:
                timetable.calculate_fitness(subjects, faculty, rooms, timeslots, divisions)
            
            # Sort by fitness
            population.sort(key=lambda x: x.fitness, reverse=True)
            
            # Track best
            if population[0].fitness > best_fitness:
                best_fitness = population[0].fitness
                best_timetable = copy.deepcopy(population[0])
            
            generation_history.append({
                'generation': generation,
                'best_fitness': population[0].fitness,
                'avg_fitness': sum(t.fitness for t in population) / len(population),
                'conflicts': len(population[0].conflicts)
            })
            
            print(f"Gen {generation}: Best={population[0].fitness:.1f}, Avg={generation_history[-1]['avg_fitness']:.1f}, Conflicts={generation_history[-1]['conflicts']}")
            
            if progress_callback:
                progress_callback(generation, self.generations, best_fitness)
            
            # Create next generation
            new_population = []
            
            # Elitism
            elite_count = max(1, int(self.population_size * self.elitism_rate))
            new_population.extend([copy.deepcopy(t) for t in population[:elite_count]])
            
            # Generate offspring
            while len(new_population) < self.population_size:
                parent1, parent2 = self.selection(population)
                child1, child2 = self.crossover(parent1, parent2)
                
                self.mutate(child1, subjects, faculty, rooms, timeslots, divisions)
                self.mutate(child2, subjects, faculty, rooms, timeslots, divisions)
                
                new_population.extend([child1, child2])
            
            population = new_population[:self.population_size]
        
        return best_timetable, generation_history

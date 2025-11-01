import random
import sqlite3
from typing import List, Dict, Tuple
import copy

class TimetableGene:
    """Represents a single class assignment"""
    def __init__(self, subject_id, faculty_id, room_id, timeslot_id):
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
    
    def calculate_fitness(self, subjects, faculty, rooms, timeslots):
        """Calculate fitness score (higher is better)"""
        score = 100
        self.conflicts = []
        
        # Check for conflicts
        used_slots = {}
        
        for gene in self.genes:
            slot_key = f"{gene.timeslot_id}"
            
            # Faculty teaching multiple classes at same time
            faculty_key = f"faculty_{gene.faculty_id}_{gene.timeslot_id}"
            if faculty_key in used_slots:
                score -= 10
                self.conflicts.append(f"Faculty conflict at timeslot {gene.timeslot_id}")
            used_slots[faculty_key] = True
            
            # Room being used multiple times at same time
            room_key = f"room_{gene.room_id}_{gene.timeslot_id}"
            if room_key in used_slots:
                score -= 10
                self.conflicts.append(f"Room conflict at timeslot {gene.timeslot_id}")
            used_slots[room_key] = True
        
        # Bonus for distributing classes evenly
        timeslot_usage = {}
        for gene in self.genes:
            timeslot_usage[gene.timeslot_id] = timeslot_usage.get(gene.timeslot_id, 0) + 1
        
        # Penalty for uneven distribution
        if timeslot_usage:
            avg_usage = sum(timeslot_usage.values()) / len(timeslot_usage)
            variance = sum((usage - avg_usage) ** 2 for usage in timeslot_usage.values()) / len(timeslot_usage)
            score -= variance * 2
        
        self.fitness = max(0, score)
        return self.fitness

class GeneticAlgorithm:
    def __init__(self, db_path='timetable.db'):
        self.db_path = db_path
        self.population_size = 50
        self.generations = 100
        self.mutation_rate = 0.1
        self.crossover_rate = 0.7
    
    def get_data(self):
        """Fetch all necessary data from database"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        
        subjects = [dict(row) for row in conn.execute('SELECT * FROM subjects').fetchall()]
        faculty = [dict(row) for row in conn.execute('SELECT * FROM faculty').fetchall()]
        rooms = [dict(row) for row in conn.execute('SELECT * FROM rooms').fetchall()]
        timeslots = [dict(row) for row in conn.execute('SELECT * FROM timeslots').fetchall()]
        
        conn.close()
        return subjects, faculty, rooms, timeslots
    
    def create_random_timetable(self, subjects, faculty, rooms, timeslots) -> Timetable:
        """Create a random timetable"""
        genes = []
        
        for subject in subjects:
            # Assign random faculty, room, and timeslot
            random_faculty = random.choice(faculty)
            random_room = random.choice(rooms)
            random_timeslot = random.choice(timeslots)
            
            gene = TimetableGene(
                subject['id'],
                random_faculty['id'],
                random_room['id'],
                random_timeslot['id']
            )
            genes.append(gene)
        
        timetable = Timetable(genes)
        return timetable
    
    def initialize_population(self, subjects, faculty, rooms, timeslots) -> List[Timetable]:
        """Create initial population of random timetables"""
        population = []
        for _ in range(self.population_size):
            timetable = self.create_random_timetable(subjects, faculty, rooms, timeslots)
            timetable.calculate_fitness(subjects, faculty, rooms, timeslots)
            population.append(timetable)
        return population
    
    def selection(self, population: List[Timetable]) -> Tuple[Timetable, Timetable]:
        """Tournament selection"""
        tournament_size = 5
        tournament = random.sample(population, tournament_size)
        tournament.sort(key=lambda x: x.fitness, reverse=True)
        return tournament[0], tournament[1]
    
    def crossover(self, parent1: Timetable, parent2: Timetable) -> Tuple[Timetable, Timetable]:
        """Single point crossover"""
        if random.random() > self.crossover_rate:
            return copy.deepcopy(parent1), copy.deepcopy(parent2)
        
        point = random.randint(1, len(parent1.genes) - 1)
        
        child1_genes = parent1.genes[:point] + parent2.genes[point:]
        child2_genes = parent2.genes[:point] + parent1.genes[point:]
        
        child1 = Timetable(copy.deepcopy(child1_genes))
        child2 = Timetable(copy.deepcopy(child2_genes))
        
        return child1, child2
    
    def mutate(self, timetable: Timetable, faculty, rooms, timeslots):
        """Random mutation"""
        for gene in timetable.genes:
            if random.random() < self.mutation_rate:
                mutation_type = random.choice(['faculty', 'room', 'timeslot'])
                
                if mutation_type == 'faculty':
                    gene.faculty_id = random.choice(faculty)['id']
                elif mutation_type == 'room':
                    gene.room_id = random.choice(rooms)['id']
                else:
                    gene.timeslot_id = random.choice(timeslots)['id']
    
    def evolve(self, progress_callback=None):
        """Main genetic algorithm evolution"""
        subjects, faculty, rooms, timeslots = self.get_data()
        
        if not subjects or not faculty or not rooms or not timeslots:
            raise Exception("Insufficient data. Please add subjects, faculty, rooms, and timeslots.")
        
        # Initialize population
        population = self.initialize_population(subjects, faculty, rooms, timeslots)
        
        best_timetable = None
        best_fitness = 0
        generation_history = []
        
        for generation in range(self.generations):
            # Evaluate fitness
            for timetable in population:
                timetable.calculate_fitness(subjects, faculty, rooms, timeslots)
            
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
                'worst_fitness': population[-1].fitness
            })
            
            # Callback for progress updates
            if progress_callback:
                progress_callback(generation, self.generations, best_fitness)
            
            # Create next generation
            new_population = []
            
            # Elitism - keep top 10%
            elite_count = max(1, self.population_size // 10)
            new_population.extend(copy.deepcopy(population[:elite_count]))
            
            # Generate offspring
            while len(new_population) < self.population_size:
                parent1, parent2 = self.selection(population)
                child1, child2 = self.crossover(parent1, parent2)
                
                self.mutate(child1, faculty, rooms, timeslots)
                self.mutate(child2, faculty, rooms, timeslots)
                
                new_population.extend([child1, child2])
            
            population = new_population[:self.population_size]
        
        return best_timetable, generation_history, subjects, faculty, rooms, timeslots

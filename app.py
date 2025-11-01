from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import json
import os
from datetime import datetime
from data_handler import DataHandler
from genetic_algorithm import GeneticAlgorithm
from backtracking import BacktrackingSolver

app = Flask(__name__, static_folder='static', static_url_path='')
CORS(app)

data_handler = DataHandler()
current_schedule = None
timetables = []

@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join('static', path)):
        return send_from_directory('static', path)
    return send_from_directory('static', 'index.html')

# List entity
@app.route('/api/data/list/<entity_type>', methods=['GET'])
def list_entity(entity_type):
    try:
        print(f"[DEBUG] Listing {entity_type}")
        all_data = data_handler.to_serializable()
        result = all_data.get(entity_type, [])
        print(f"[DEBUG] Found {len(result)} items")
        return jsonify({'success': True, 'data': result})
    except Exception as e:
        print(f"[ERROR] List failed: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Add entity
@app.route('/api/data/add', methods=['POST'])
def add_entity():
    try:
        payload = request.json
        print(f"[DEBUG] Add request: {payload}")
        entity_type = payload.get('type')
        item = payload.get('item')
        
        if not entity_type or not item:
            return jsonify({'success': False, 'error': 'Missing type or item'}), 400
        
        added = data_handler.add_item(entity_type, item)
        print(f"[DEBUG] Added successfully: {added}")
        return jsonify({'success': True, 'item': added})
    except Exception as e:
        print(f"[ERROR] Add failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

# Delete entity
@app.route('/api/data/delete', methods=['POST'])
def delete_entity():
    try:
        payload = request.json
        print(f"[DEBUG] Delete request: {payload}")
        entity_type = payload.get('type')
        item_id = int(payload.get('id'))
        
        if not entity_type or item_id is None:
            return jsonify({'success': False, 'error': 'Missing type or id'}), 400
        
        success = data_handler.delete_item(entity_type, item_id)
        print(f"[DEBUG] Delete result: {success}")
        return jsonify({'success': success})
    except Exception as e:
        print(f"[ERROR] Delete failed: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# Upload bulk data
@app.route('/api/data/upload', methods=['POST'])
def upload_data():
    try:
        data = request.json
        entity_type = data.get('type')
        items = data.get('data')
        
        data_handler.load_from_dict(items, entity_type)
        
        return jsonify({
            'success': True,
            'message': f'{entity_type} data uploaded successfully'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

# Get all data
@app.route('/api/data/get', methods=['GET'])
def get_data():
    try:
        all_data = data_handler.to_serializable()
        return jsonify({'success': True, 'data': all_data})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 400

# List timetables
@app.route('/api/timetables', methods=['GET'])
def list_timetables():
    print(f"[DEBUG] Listing timetables: {len(timetables)} found")
    return jsonify({'success': True, 'data': timetables})

# Delete timetable
@app.route('/api/timetables/delete', methods=['POST'])
def delete_timetable():
    try:
        tid = int(request.json.get('id'))
        print(f"[DEBUG] Deleting timetable {tid}")
        global timetables
        original_len = len(timetables)
        timetables = [t for t in timetables if t['id'] != tid]
        success = len(timetables) < original_len
        print(f"[DEBUG] Delete timetable result: {success}")
        return jsonify({'success': success})
    except Exception as e:
        print(f"[ERROR] Delete timetable failed: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ===== TIMETABLE GENERATION =====

@app.route('/generate-timetable', methods=['POST'])
def generate_timetable():
    try:
        data = request.get_json()
        algorithm = data.get('algorithm', 'genetic')  # 'genetic' or 'backtracking'
        
        if algorithm == 'genetic':
            ga = GeneticAlgorithm()
            best_timetable, history, subjects, faculty, rooms, timeslots = ga.evolve()
            
            # Format result
            schedule = []
            for gene in best_timetable.genes:
                subject = next(s for s in subjects if s['id'] == gene.subject_id)
                fac = next(f for f in faculty if f['id'] == gene.faculty_id)
                room = next(r for r in rooms if r['id'] == gene.room_id)
                slot = next(t for t in timeslots if t['id'] == gene.timeslot_id)
                
                schedule.append({
                    'subject': subject['name'],
                    'subject_code': subject['code'],
                    'faculty': fac['name'],
                    'room': room['room_number'],
                    'day': slot['day'],
                    'start_time': slot['start_time'],
                    'end_time': slot['end_time']
                })
            
            return jsonify({
                'success': True,
                'algorithm': 'Genetic Algorithm',
                'fitness_score': best_timetable.fitness,
                'conflicts': best_timetable.conflicts,
                'schedule': schedule,
                'generation_history': history,
                'generated_at': datetime.now().isoformat()
            })
        
        elif algorithm == 'backtracking':
            solver = BacktrackingSolver()
            result, subjects, faculty, rooms, timeslots = solver.solve()
            
            # Format result
            schedule = []
            for assignment in result:
                subject_id, faculty_id, room_id, timeslot_id = assignment
                
                subject = next(s for s in subjects if s['id'] == subject_id)
                fac = next(f for f in faculty if f['id'] == faculty_id)
                room = next(r for r in rooms if r['id'] == room_id)
                slot = next(t for t in timeslots if t['id'] == timeslot_id)
                
                schedule.append({
                    'subject': subject['name'],
                    'subject_code': subject['code'],
                    'faculty': fac['name'],
                    'room': room['room_number'],
                    'day': slot['day'],
                    'start_time': slot['start_time'],
                    'end_time': slot['end_time']
                })
            
            return jsonify({
                'success': True,
                'algorithm': 'Backtracking',
                'fitness_score': 100,
                'conflicts': [],
                'schedule': schedule,
                'generated_at': datetime.now().isoformat()
            })
        
        else:
            return jsonify({'error': 'Invalid algorithm'}), 400
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/compare-algorithms', methods=['POST'])
def compare_algorithms():
    """Compare both algorithms and return the best result"""
    try:
        results = []
        
        # Run Genetic Algorithm
        try:
            ga = GeneticAlgorithm()
            best_timetable, history, subjects, faculty, rooms, timeslots = ga.evolve()
            
            ga_schedule = []
            for gene in best_timetable.genes:
                subject = next(s for s in subjects if s['id'] == gene.subject_id)
                fac = next(f for f in faculty if f['id'] == gene.faculty_id)
                room = next(r for r in rooms if r['id'] == gene.room_id)
                slot = next(t for t in timeslots if t['id'] == gene.timeslot_id)
                
                ga_schedule.append({
                    'subject': subject['name'],
                    'subject_code': subject['code'],
                    'faculty': fac['name'],
                    'room': room['room_number'],
                    'day': slot['day'],
                    'start_time': slot['start_time'],
                    'end_time': slot['end_time']
                })
            
            results.append({
                'algorithm': 'Genetic Algorithm',
                'fitness_score': best_timetable.fitness,
                'conflicts': len(best_timetable.conflicts),
                'schedule': ga_schedule,
                'execution_time': 'Fast'
            })
        except Exception as e:
            results.append({
                'algorithm': 'Genetic Algorithm',
                'error': str(e)
            })
        
        # Run Backtracking (with timeout for large datasets)
        try:
            solver = BacktrackingSolver()
            result, subjects, faculty, rooms, timeslots = solver.solve()
            
            bt_schedule = []
            for assignment in result:
                subject_id, faculty_id, room_id, timeslot_id = assignment
                
                subject = next(s for s in subjects if s['id'] == subject_id)
                fac = next(f for f in faculty if f['id'] == faculty_id)
                room = next(r for r in rooms if r['id'] == room_id)
                slot = next(t for t in timeslots if t['id'] == timeslot_id)
                
                bt_schedule.append({
                    'subject': subject['name'],
                    'subject_code': subject['code'],
                    'faculty': fac['name'],
                    'room': room['room_number'],
                    'day': slot['day'],
                    'start_time': slot['start_time'],
                    'end_time': slot['end_time']
                })
            
            results.append({
                'algorithm': 'Backtracking',
                'fitness_score': 100,  # Perfect solution
                'conflicts': 0,
                'schedule': bt_schedule,
                'execution_time': 'Slow'
            })
        except Exception as e:
            results.append({
                'algorithm': 'Backtracking',
                'error': str(e)
            })
        
        # Determine best result
        valid_results = [r for r in results if 'error' not in r]
        if valid_results:
            best = max(valid_results, key=lambda x: x['fitness_score'])
            return jsonify({
                'success': True,
                'all_results': results,
                'best_algorithm': best['algorithm'],
                'best_timetable': best
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Both algorithms failed',
                'details': results
            }), 500
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Generate schedule
@app.route('/api/generate', methods=['POST'])
def generate_schedule():
    global current_schedule, timetables
    
    try:
        params = request.json or {}
        print(f"[DEBUG] Generate params: {params}")
        
        population_size = params.get('population_size', 50)
        generations = params.get('generations', 100)
        mutation_rate = params.get('mutation_rate', 0.1)
        
        all_data = data_handler.get_all_data()
        
        # Validate
        if not all([all_data['time_slots'], all_data['rooms'], 
                   all_data['faculty'], all_data['subjects']]):
            return jsonify({
                'success': False,
                'error': 'Please add all required data first (time slots, rooms, faculty, subjects)'
            }), 400
        
        print(f"[DEBUG] Running GA with {len(all_data['subjects'])} subjects, {len(all_data['faculty'])} faculty, {len(all_data['rooms'])} rooms, {len(all_data['time_slots'])} timeslots")
        
        ga = GeneticAlgorithm(
            all_data['time_slots'],
            all_data['rooms'],
            all_data['faculty'],
            all_data['subjects'],
            population_size=population_size,
            generations=generations,
            mutation_rate=mutation_rate
        )
        
        best_schedule, fitness_history = ga.evolve()
        current_schedule = best_schedule
        
        new_id = max([t['id'] for t in timetables], default=0) + 1
        record = {
            'id': new_id,
            'name': f'Timetable #{new_id}',
            'schedule': best_schedule.to_dict(),
            'fitness_history': fitness_history,
            'final_fitness': fitness_history[-1] if fitness_history else 0,
            'generated_at': datetime.utcnow().isoformat() + 'Z'
        }
        timetables.append(record)
        
        print(f"[DEBUG] Generated timetable {new_id} with fitness {record['final_fitness']}")
        
        return jsonify({
            'success': True,
            'schedule': best_schedule.to_dict(),
            'fitness_history': fitness_history,
            'final_fitness': record['final_fitness'],
            'timetable_id': new_id
        })
        
    except Exception as e:
        print(f"[ERROR] Generation failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/schedule/get', methods=['GET'])
def get_schedule():
    if current_schedule is None:
        return jsonify({'success': False, 'error': 'No schedule generated yet'}), 404
    return jsonify({'success': True, 'schedule': current_schedule.to_dict()})

@app.route('/api/schedule/export', methods=['GET'])
def export_schedule():
    if current_schedule is None:
        return jsonify({'success': False, 'error': 'No schedule generated yet'}), 404
    return jsonify({'success': True, 'schedule': current_schedule.to_dict()})

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🚀 Starting Timetable Scheduler Backend")
    print("="*60)
    print("📍 Server running at: http://localhost:5000")
    print("📍 Dashboard at: http://localhost:5000/dashboard.html")
    print("="*60 + "\n")
    app.run(debug=True, port=5000, use_reloader=True)

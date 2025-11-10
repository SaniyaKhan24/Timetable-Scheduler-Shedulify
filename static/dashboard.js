console.log('📊 Dashboard.js loading...');

// ===== GENERATE TIMETABLE =====
async function generateSchedule() {
    console.log('🚀 generateSchedule called!');
    
    const divisionSelect = document.getElementById('division-select');
    if (!divisionSelect) {
        console.error('❌ Division select not found!');
        alert('Error: Division selector not found');
        return false;
    }
    
    const divisionId = divisionSelect.value;
    if (!divisionId) {
        alert('⚠️ Please select a division first!');
        return false;
    }
    
    const populationSize = parseInt(document.getElementById('population-size')?.value || 50);
    const generations = parseInt(document.getElementById('generations')?.value || 100);
    const mutationRate = parseFloat(document.getElementById('mutation-rate')?.value || 0.1);
    
    console.log(`📊 Config: Division=${divisionId}, Pop=${populationSize}, Gen=${generations}, Mut=${mutationRate}`);
    
    // Show progress
    const progress = document.getElementById('progress');
    const results = document.getElementById('results');
    if (progress) progress.classList.remove('hidden');
    if (results) results.classList.add('hidden');
    
    try {
        console.log('📡 Sending request to backend...');
        
        const response = await fetch('http://localhost:5000/api/timetable/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                divisionId: parseInt(divisionId),
                populationSize,
                generations,
                mutationRate
            })
        });
        
        console.log(`📥 Response status: ${response.status}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Server error:', errorText);
            throw new Error(`Server error ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Data received:', data);
        
        if (progress) progress.classList.add('hidden');
        
        if (data.success && data.schedule) {
            let timetables = JSON.parse(localStorage.getItem('timetables')) || [];
            
            const timetable = {
                id: Date.now(),
                name: `Timetable - ${divisionSelect.options[divisionSelect.selectedIndex].text}`,
                status: 'completed',
                fitness: Math.round(data.fitness_score || 0),
                createdAt: new Date().toISOString(),
                schedule: data.schedule,
                conflicts: data.conflicts || [],
                algorithm: 'Genetic Algorithm'
            };
            
            timetables.push(timetable);
            localStorage.setItem('timetables', JSON.stringify(timetables));
            console.log('💾 Saved to localStorage');
            
            displayResults(data);
            
            alert(`✅ Timetable generated!\n\nFitness: ${timetable.fitness}%\nClasses: ${data.schedule.length}`);
            
            if (typeof renderTimetables === 'function') {
                renderTimetables();
            }
        } else {
            throw new Error(data.error || 'Unknown error');
        }
        
    } catch (error) {
        console.error('❌ Generation failed:', error);
        if (progress) progress.classList.add('hidden');
        alert(`Failed to generate timetable!\n\n${error.message}\n\nCheck:\n1. Flask server running\n2. Browser console (F12) for details`);
    }
    
    return false;
}

// ===== DISPLAY RESULTS =====
function displayResults(data) {
    console.log('📊 Displaying results...');
    
    const results = document.getElementById('results');
    const scheduleTable = document.getElementById('schedule-table');
    
    if (!scheduleTable) {
        console.error('❌ #schedule-table not found!');
        return;
    }
    
    if (!data.schedule || data.schedule.length === 0) {
        scheduleTable.innerHTML = '<p style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.8);">No schedule data available</p>';
        if (results) results.classList.remove('hidden');
        return;
    }
    
    if (typeof window.generateScheduleTable === 'function') {
        scheduleTable.innerHTML = window.generateScheduleTable(data.schedule);
        console.log('✅ Schedule table rendered');
    } else {
        console.error('❌ generateScheduleTable not available!');
        scheduleTable.innerHTML = '<p style="color: red;">Error: Display function not loaded</p>';
    }
    
    if (results) {
        results.classList.remove('hidden');
        results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ✅ ATTACH EVENT LISTENER WHEN DOM IS READY
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Dashboard.js: DOM ready, attaching event listeners...');
    
    const generateBtn = document.getElementById('generate-schedule-btn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateSchedule);
        console.log('✅ Generate button event listener attached');
    } else {
        console.warn('⚠️ Generate button not found yet');
    }
});

// Also make it globally available as backup
window.generateSchedule = generateSchedule;

console.log('✅ Dashboard.js loaded');

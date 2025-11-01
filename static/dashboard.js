const API_URL = 'http://127.0.0.1:5000';

async function generateTimetable(algorithm) {
    showProgress();
    
    try {
        const response = await fetch(`${API_URL}/generate-timetable`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ algorithm })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to generate timetable');
        }
        
        const result = await response.json();
        displayResults(result);
    } catch (error) {
        hideProgress();
        alert('Error: ' + error.message);
    }
}

async function compareBoth() {
    showProgress('Comparing algorithms...');
    
    try {
        const response = await fetch(`${API_URL}/compare-algorithms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to compare algorithms');
        }
        
        const result = await response.json();
        displayComparisonResults(result);
    } catch (error) {
        hideProgress();
        alert('Error: ' + error.message);
    }
}

function showProgress(text = 'Generating timetable...') {
    document.getElementById('progress-section').classList.remove('hidden');
    document.getElementById('results-section').classList.add('hidden');
    document.getElementById('progress-text').textContent = text;
}

function hideProgress() {
    document.getElementById('progress-section').classList.add('hidden');
}

function displayResults(result) {
    hideProgress();
    
    const resultsSection = document.getElementById('results-section');
    const algorithmInfo = document.getElementById('algorithm-info');
    const tableBody = document.getElementById('timetable-body');
    
    // Show results
    resultsSection.classList.remove('hidden');
    
    // Display algorithm info
    algorithmInfo.innerHTML = `
        <div>
            <h2>✅ ${result.algorithm}</h2>
            <p>Fitness Score: <strong>${result.fitness_score.toFixed(2)}</strong></p>
            <p>Conflicts: <strong>${result.conflicts.length}</strong></p>
            ${result.conflicts.length > 0 ? `<p style="color: #f87171;">Warnings: ${result.conflicts.join(', ')}</p>` : ''}
        </div>
    `;
    
    // Display schedule
    if (result.schedule && result.schedule.length > 0) {
        tableBody.innerHTML = result.schedule
            .sort((a, b) => {
                const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
                if (dayDiff !== 0) return dayDiff;
                return a.start_time.localeCompare(b.start_time);
            })
            .map(item => `
                <tr>
                    <td>${item.day}</td>
                    <td>${item.start_time} - ${item.end_time}</td>
                    <td><strong>${item.subject}</strong><br><small>${item.subject_code}</small></td>
                    <td>${item.faculty}</td>
                    <td>${item.room}</td>
                </tr>
            `).join('');
    } else {
        tableBody.innerHTML = '<tr><td colspan="5">No schedule generated</td></tr>';
    }
}

function displayComparisonResults(result) {
    hideProgress();
    
    if (!result.success) {
        alert('Comparison failed: ' + result.error);
        return;
    }
    
    const resultsSection = document.getElementById('results-section');
    const algorithmInfo = document.getElementById('algorithm-info');
    const tableBody = document.getElementById('timetable-body');
    
    resultsSection.classList.remove('hidden');
    
    // Display comparison info
    algorithmInfo.innerHTML = `
        <div>
            <h2>🏆 Best: ${result.best_algorithm}</h2>
            <p>All Results:</p>
            <ul style="color: white; margin-left: 1rem;">
                ${result.all_results.map(r => `
                    <li>
                        <strong>${r.algorithm}:</strong> 
                        ${r.error ? `❌ ${r.error}` : `✅ Score: ${r.fitness_score}, Conflicts: ${r.conflicts}`}
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
    
    // Display best timetable
    const best = result.best_timetable;
    if (best && best.schedule) {
        tableBody.innerHTML = best.schedule
            .sort((a, b) => {
                const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                const dayDiff = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day);
                if (dayDiff !== 0) return dayDiff;
                return a.start_time.localeCompare(b.start_time);
            })
            .map(item => `
                <tr>
                    <td>${item.day}</td>
                    <td>${item.start_time} - ${item.end_time}</td>
                    <td><strong>${item.subject}</strong><br><small>${item.subject_code}</small></td>
                    <td>${item.faculty}</td>
                    <td>${item.room}</td>
                </tr>
            `).join('');
    }
}

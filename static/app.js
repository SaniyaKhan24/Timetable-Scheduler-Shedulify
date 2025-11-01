const API_BASE = 'http://localhost:5000/api';

console.log('🚀 App.js loaded');

// ===== DATA STORAGE =====
let timetables = JSON.parse(localStorage.getItem('timetables')) || [];
let divisions = JSON.parse(localStorage.getItem('divisions')) || [];
let subjects = JSON.parse(localStorage.getItem('subjects')) || [];
let faculty = JSON.parse(localStorage.getItem('faculty')) || [];
let rooms = JSON.parse(localStorage.getItem('rooms')) || [];
let timeslots = JSON.parse(localStorage.getItem('timeslots')) || [];

// Track current editing item
let currentEditType = null;
let currentEditIndex = null;

// ===== UTILITY FUNCTIONS =====
async function apiGet(path) {
    console.log(`📤 GET ${API_BASE}${path}`);
    try {
        const res = await fetch(`${API_BASE}${path}`);
        const data = await res.json();
        console.log(`📥 Response:`, data);
        return data;
    } catch (error) {
        console.error(`❌ GET Error:`, error);
        throw error;
    }
}

async function apiPost(path, body) {
    console.log(`📤 POST ${API_BASE}${path}`, body);
    try {
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body)
        });
        const data = await res.json();
        console.log(`📥 Response:`, data);
        return data;
    } catch (error) {
        console.error(`❌ POST Error:`, error);
        throw error;
    }
}

// ===== HEADER/FOOTER LOADER =====
async function loadHeaderFooter() {
    console.log('Loading header/footer...');
    try {
        const [hdrResp, ftrResp] = await Promise.all([
            fetch('./components/header.html').catch(() => null),
            fetch('./components/footer.html').catch(() => null)
        ]);
        
        if (hdrResp && hdrResp.ok) {
            const headerHtml = await hdrResp.text();
            const holder = document.getElementById('site-header');
            if (holder) {
                holder.innerHTML = headerHtml;
                console.log('✅ Header loaded');
            }
        }
        
        if (ftrResp && ftrResp.ok) {
            const footerHtml = await ftrResp.text();
            const fHolder = document.getElementById('site-footer');
            if (fHolder) {
                fHolder.innerHTML = footerHtml;
                console.log('✅ Footer loaded');
            }
        }
        
        const logo = document.getElementById('logo-link');
        if (logo) logo.addEventListener('click', () => window.location.href = 'index.html');
        
        const path = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.site-header .nav-link').forEach(a => {
            const href = a.getAttribute('href') || '';
            if (href.includes(path) || href.split('#')[0] === path) {
                a.classList.add('active');
            }
        });
    } catch (err) {
        console.warn('⚠️ Header/footer load failed:', err);
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    loadHeader();
    initializeTabs();
    renderAllData();
});

// ===== HEADER LOADING =====
function loadHeader() {
    const headerHTML = `
        <nav class="site-header navbar" role="navigation" aria-label="Main navigation">
            <div class="nav-container">
                <!-- Left: Logo and Name -->
                <div class="logo" id="logo-link" aria-label="Home" style="cursor: pointer;">
                    <span class="logo-icon"><i class="fas fa-calendar-alt"></i></span>
                    <span class="logo-text">Schedulify</span>
                </div>

                <!-- Center: Main Navigation -->
                <ul class="nav-links nav-center" role="menubar">
                    <li role="none"><a role="menuitem" class="nav-link" href="index.html">Home</a></li>
                    <li role="none"><a role="menuitem" class="nav-link" href="index.html#features">Features</a></li>
                    <li role="none"><a role="menuitem" class="nav-link" href="index.html#how-it-works">How It Works</a></li>
                </ul>

                <!-- Right: Dashboard Button -->
                <div class="nav-right">
                    <a href="dashboard.html" class="btn btn-nav active"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
                </div>
            </div>
        </nav>
    `;
    
    document.getElementById('site-header').innerHTML = headerHTML;
    
    // Add logo click handler
    const logo = document.getElementById('logo-link');
    if (logo) {
        logo.addEventListener('click', () => {
            window.location.href = 'index.html';
        });
    }
}

// ===== TAB NAVIGATION =====
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-nav-btn');
    const tabPages = document.querySelectorAll('.tab-page');
    
    console.log('Initializing tabs:', tabButtons.length, 'buttons found');
    
    // Ensure only the first tab is active on load
    tabPages.forEach((page, index) => {
        if (index === 0) {
            page.classList.add('active');
            page.style.display = 'block';
        } else {
            page.classList.remove('active');
            page.style.display = 'none';
        }
    });
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('data-page');
            console.log('Tab clicked:', targetPage);
            
            // Remove active class from all buttons
            tabButtons.forEach(btn => btn.classList.remove('active'));
            
            // Add active class to clicked button
            this.classList.add('active');
            
            // Hide all tab pages
            tabPages.forEach(page => {
                page.classList.remove('active');
                page.style.display = 'none';
            });
            
            // Show target page
            const targetElement = document.getElementById(`${targetPage}-page`);
            if (targetElement) {
                targetElement.classList.add('active');
                targetElement.style.display = 'block';
                console.log('Switched to page:', targetPage);
            } else {
                console.error('Page not found:', `${targetPage}-page`);
            }
        });
    });
}

// ===== RENDER ALL DATA =====
function renderAllData() {
    renderTimetables();
    renderDivisions();
    renderSubjects();
    renderFaculty();
    renderRooms();
    renderTimeslots();
}

// ===== RENDER TIMETABLES =====
function renderTimetables() {
    const container = document.querySelector('.timetables-grid');
    if (!container) return;
    
    if (timetables.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    container.innerHTML = timetables.map(tt => `
        <div class="timetable-card">
            <div class="card-header">
                <div class="card-icon">📅</div>
                <button class="card-delete" onclick="deleteItem('timetables', ${tt.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            <h3>${tt.name}</h3>
            <span class="card-status ${tt.status}">${tt.status}</span>
            <div class="card-info">
                <p><i class="fas fa-trophy"></i> Fitness Score: <span class="score">${tt.fitness}%</span></p>
                <p><i class="fas fa-calendar"></i> Created: <span class="date">${new Date(tt.createdAt).toLocaleDateString()}</span></p>
            </div>
            <button class="btn-view" onclick="viewTimetable(${tt.id})">
                <i class="fas fa-eye"></i> View Details
            </button>
        </div>
    `).join('');
}

// ===== RENDER DIVISIONS =====
function renderDivisions() {
    const container = document.getElementById('divisions-list');
    if (!container) return;
    
    if (divisions.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.6);">No divisions added yet. Click "Add Division" to create one.</p>';
        return;
    }
    
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th><i class="fas fa-layer-group"></i> Division Name</th>
                    <th><i class="fas fa-graduation-cap"></i> Year</th>
                    <th><i class="fas fa-users"></i> Students</th>
                    <th><i class="fas fa-book"></i> Subjects</th>
                    <th><i class="fas fa-cog"></i> Actions</th>
                </tr>
            </thead>
            <tbody>
                ${divisions.map((division, index) => `
                    <tr>
                        <td><strong>${escapeHtml(division.name)}</strong></td>
                        <td>${division.year}</td>
                        <td>${division.studentCount}</td>
                        <td>${division.subjects?.length || 0} assigned</td>
                        <td>
                            <button class="btn btn-secondary" style="padding: 0.5rem 1rem; margin-right: 0.5rem;" onclick="editItem('divisions', ${index})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-secondary" style="padding: 0.5rem 1rem;" onclick="deleteItem('divisions', ${division.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ===== RENDER SUBJECTS =====
function renderSubjects() {
    const container = document.getElementById('subjects-list');
    if (!container) return;
    
    if (subjects.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.6);">No subjects added yet. Click "Add Subject" to create one.</p>';
        return;
    }
    
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th><i class="fas fa-code"></i> Code</th>
                    <th><i class="fas fa-book"></i> Name</th>
                    <th><i class="fas fa-clock"></i> Hours/Week</th>
                    <th><i class="fas fa-layer-group"></i> Type</th>
                    <th><i class="fas fa-cog"></i> Actions</th>
                </tr>
            </thead>
            <tbody>
                ${subjects.map((subject, index) => `
                    <tr>
                        <td><strong>${escapeHtml(subject.code)}</strong></td>
                        <td>${escapeHtml(subject.name)}</td>
                        <td>${subject.hours}</td>
                        <td><span style="text-transform: capitalize;">${subject.type}</span></td>
                        <td>
                            <button class="btn btn-secondary" style="padding: 0.5rem 1rem; margin-right: 0.5rem;" onclick="editItem('subjects', ${index})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-secondary" style="padding: 0.5rem 1rem;" onclick="deleteItem('subjects', ${subject.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ===== RENDER FACULTY =====
function renderFaculty() {
    const container = document.getElementById('faculty-list');
    if (!container) return;
    
    if (faculty.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.6);">No faculty members added yet. Click "Add Faculty" to create one.</p>';
        return;
    }
    
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th><i class="fas fa-user"></i> Name</th>
                    <th><i class="fas fa-id-badge"></i> Employee ID</th>
                    <th><i class="fas fa-graduation-cap"></i> Department</th>
                    <th><i class="fas fa-clock"></i> Max Hours</th>
                    <th><i class="fas fa-calendar"></i> Availability</th>
                    <th><i class="fas fa-cog"></i> Actions</th>
                </tr>
            </thead>
            <tbody>
                ${faculty.map((member, index) => `
                    <tr>
                        <td><strong>${escapeHtml(member.name)}</strong></td>
                        <td>${escapeHtml(member.employeeId)}</td>
                        <td>${escapeHtml(member.department)}</td>
                        <td>${member.maxHours}/week</td>
                        <td>
                            <small style="display: block; margin-bottom: 0.25rem;">
                                <strong>Days:</strong> ${member.availableDays?.length || 0} days
                            </small>
                            <small style="display: block;">
                                <strong>Slots:</strong> ${member.availableTimeSlots?.length || 0} time slots
                            </small>
                        </td>
                        <td>
                            <button class="btn btn-secondary" style="padding: 0.5rem 1rem; margin-right: 0.5rem;" onclick="editItem('faculty', ${index})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-secondary" style="padding: 0.5rem 1rem;" onclick="deleteItem('faculty', ${member.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ===== RENDER ROOMS =====
function renderRooms() {
    const container = document.getElementById('rooms-list');
    if (!container) return;
    
    if (rooms.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.6);">No rooms added yet. Click "Add Room" to create one.</p>';
        return;
    }
    
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th><i class="fas fa-door-open"></i> Room</th>
                    <th><i class="fas fa-building"></i> Building</th>
                    <th><i class="fas fa-users"></i> Capacity</th>
                    <th><i class="fas fa-layer-group"></i> Type</th>
                    <th><i class="fas fa-cog"></i> Actions</th>
                </tr>
            </thead>
            <tbody>
                ${rooms.map((room, index) => `
                    <tr>
                        <td><strong>${escapeHtml(room.number)}</strong></td>
                        <td>${escapeHtml(room.building)}</td>
                        <td>${room.capacity}</td>
                        <td style="text-transform: capitalize;">${room.type}</td>
                        <td>
                            <button class="btn btn-secondary" style="padding: 0.5rem 1rem; margin-right: 0.5rem;" onclick="editItem('rooms', ${index})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-secondary" style="padding: 0.5rem 1rem;" onclick="deleteItem('rooms', ${room.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ===== RENDER TIMESLOTS =====
function renderTimeslots() {
    const container = document.getElementById('timeslots-list');
    if (!container) return;
    
    if (timeslots.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 2rem; color: rgba(255,255,255,0.6);">No time slots added yet. Click "Add Time Slot" to create one.</p>';
        return;
    }
    
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th><i class="fas fa-calendar-day"></i> Day</th>
                    <th><i class="fas fa-clock"></i> Start Time</th>
                    <th><i class="fas fa-clock"></i> End Time</th>
                    <th><i class="fas fa-hourglass-half"></i> Duration</th>
                    <th><i class="fas fa-cog"></i> Actions</th>
                </tr>
            </thead>
            <tbody>
                ${timeslots.map((slot, index) => `
                    <tr>
                        <td><strong>${slot.day}</strong></td>
                        <td>${slot.startTime}</td>
                        <td>${slot.endTime}</td>
                        <td>${slot.duration} min</td>
                        <td>
                            <button class="btn btn-secondary" style="padding: 0.5rem 1rem; margin-right: 0.5rem;" onclick="editItem('timeslots', ${index})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-secondary" style="padding: 0.5rem 1rem;" onclick="deleteItem('timeslots', ${slot.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

// ===== UTILITY FUNCTION =====
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// ===== MODAL FUNCTIONS =====
function toggleForm(type) {
    openModal(type, null);
}

function openModal(type, item = null) {
    const modal = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const modalFormFields = document.getElementById('modal-form-fields');
    const submitBtn = document.getElementById('modal-submit-btn');
    
    const isEdit = item !== null;
    
    // Store current edit info
    currentEditType = type;
    currentEditIndex = isEdit ? subjects.indexOf(item) || faculty.indexOf(item) || rooms.indexOf(item) || timeslots.indexOf(item) : null;
    
    // Set modal title and description
    const titles = {
        subjects: isEdit ? 'Edit Subject' : 'Add New Subject',
        faculty: isEdit ? 'Edit Faculty' : 'Add New Faculty',
        rooms: isEdit ? 'Edit Room' : 'Add New Room',
        timeslots: isEdit ? 'Edit Time Slot' : 'Add New Time Slot',
        divisions: isEdit ? 'Edit Division' : 'Add New Division'
    };
    
    const descriptions = {
        subjects: 'Manage course subject information',
        faculty: 'Manage faculty member details',
        rooms: 'Manage classroom information',
        timeslots: 'Define class scheduling time slots',
        divisions: 'Manage student division information'
    };
    
    modalTitle.textContent = titles[type];
    modalDescription.textContent = descriptions[type];
    submitBtn.innerHTML = `<i class="fas fa-${isEdit ? 'save' : 'check'}"></i> ${isEdit ? 'Update' : 'Create'} Item`;
    
    // Generate form fields
    modalFormFields.innerHTML = generateFormFields(type, item);
    
    // Handle form submission
    const form = document.getElementById('modal-form');
    form.onsubmit = (e) => {
        e.preventDefault();
        handleFormSubmit(type, item);
    };
    
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('modal-overlay');
    const modalContainer = modal.querySelector('.modal-container');
    modal.classList.remove('active', 'fullscreen-modal');
    modalContainer.classList.remove('fullscreen-modal');
    // Optionally restore modalContainer content if needed
}

function generateFormFields(type, item = null) {
    const forms = {
        divisions: `
            <div class="form-group">
                <label><i class="fas fa-layer-group"></i> Division Name</label>
                <input type="text" id="division-name" value="${item?.name || ''}" placeholder="e.g., A, B, C" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-graduation-cap"></i> Year/Semester</label>
                <select id="division-year" required>
                    <option value="1" ${item?.year === '1' ? 'selected' : ''}>First Year</option>
                    <option value="2" ${item?.year === '2' ? 'selected' : ''}>Second Year</option>
                    <option value="3" ${item?.year === '3' ? 'selected' : ''}>Third Year</option>
                    <option value="4" ${item?.year === '4' ? 'selected' : ''}>Fourth Year</option>
                </select>
            </div>
            <div class="form-group">
                <label><i class="fas fa-users"></i> Number of Students</label>
                <input type="number" id="division-students" value="${item?.studentCount || 60}" min="1" max="200" required>
                <small>Total students in this division</small>
            </div>
            <div class="form-group">
                <label><i class="fas fa-book"></i> Assign Subjects</label>
                <select id="division-subjects" multiple style="min-height: 120px;">
                    ${subjects.map(subject => `
                        <option value="${subject.id}" ${item?.subjects?.includes(subject.id) ? 'selected' : ''}>
                            ${subject.code} - ${subject.name}
                        </option>
                    `).join('')}
                </select>
                <small>Hold Ctrl/Cmd to select multiple subjects</small>
            </div>
        `,
        subjects: `
            <div class="form-group">
                <label><i class="fas fa-book"></i> Subject Code</label>
                <input type="text" id="subject-code" value="${item?.code || ''}" placeholder="e.g., CS101" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-heading"></i> Subject Name</label>
                <input type="text" id="subject-name" value="${item?.name || ''}" placeholder="e.g., Data Structures" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-clock"></i> Hours per Week</label>
                <input type="number" id="subject-hours" value="${item?.hours || 3}" min="1" max="10" required>
                <small>Number of class hours per week</small>
            </div>
            <div class="form-group">
                <label><i class="fas fa-layer-group"></i> Type</label>
                <select id="subject-type" required>
                    <option value="theory" ${item?.type === 'theory' ? 'selected' : ''}>Theory</option>
                    <option value="lab" ${item?.type === 'lab' ? 'selected' : ''}>Lab</option>
                    <option value="practical" ${item?.type === 'practical' ? 'selected' : ''}>Practical</option>
                </select>
            </div>
        `,
        faculty: `
            <div class="form-group">
                <label><i class="fas fa-user"></i> Faculty Name</label>
                <input type="text" id="faculty-name" value="${item?.name || ''}" placeholder="e.g., Dr. John Smith" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-id-badge"></i> Employee ID</label>
                <input type="text" id="faculty-id" value="${item?.employeeId || ''}" placeholder="e.g., FAC001" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-graduation-cap"></i> Department</label>
                <input type="text" id="faculty-dept" value="${item?.department || ''}" placeholder="e.g., Computer Science" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-envelope"></i> Email</label>
                <input type="email" id="faculty-email" value="${item?.email || ''}" placeholder="e.g., john.smith@university.edu">
            </div>
            <div class="form-group">
                <label><i class="fas fa-clock"></i> Max Hours per Week</label>
                <input type="number" id="faculty-hours" value="${item?.maxHours || 20}" min="1" max="40" required>
                <small>Maximum teaching hours per week</small>
            </div>
            <div class="form-group">
                <label><i class="fas fa-calendar-check"></i> Available Days</label>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                    ${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => `
                        <label style="display: flex; align-items: center; gap: 0.25rem; background: rgba(255,255,255,0.1); padding: 0.5rem 0.75rem; border-radius: 0.5rem; cursor: pointer;">
                            <input type="checkbox" id="faculty-day-${day}" value="${day}" 
                                ${item?.availableDays?.includes(day) ? 'checked' : ''} 
                                style="cursor: pointer;">
                            <span>${day.substring(0, 3)}</span>
                        </label>
                    `).join('')}
                </div>
                <small>Select days when faculty is available</small>
            </div>
            <div class="form-group">
                <label><i class="fas fa-clock"></i> Available Time Slots</label>
                <div style="max-height: 200px; overflow-y: auto; background: rgba(255,255,255,0.05); padding: 0.75rem; border-radius: 0.5rem; border: 1px solid rgba(255,255,255,0.2);">
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 0.5rem;">
                        ${generateTimeSlotOptions(item?.availableTimeSlots || [])}
                    </div>
                </div>
                <small>Select available time slots (8:00 AM - 6:00 PM)</small>
            </div>
        `,
        rooms: `
            <div class="form-group">
                <label><i class="fas fa-door-open"></i> Room Number</label>
                <input type="text" id="room-number" value="${item?.number || ''}" placeholder="e.g., 201" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-building"></i> Building</label>
                <input type="text" id="room-building" value="${item?.building || ''}" placeholder="e.g., Main Block" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-users"></i> Capacity</label>
                <input type="number" id="room-capacity" value="${item?.capacity || 30}" min="1" max="500" required>
                <small>Maximum number of students</small>
            </div>
            <div class="form-group">
                <label><i class="fas fa-layer-group"></i> Room Type</label>
                <select id="room-type" required>
                    <option value="classroom" ${item?.type === 'classroom' ? 'selected' : ''}>Classroom</option>
                    <option value="lab" ${item?.type === 'lab' ? 'selected' : ''}>Lab</option>
                    <option value="auditorium" ${item?.type === 'auditorium' ? 'selected' : ''}>Auditorium</option>
                </select>
            </div>
            <div class="form-group">
                <label><i class="fas fa-check-circle"></i> Facilities</label>
                <input type="text" id="room-facilities" value="${item?.facilities || ''}" placeholder="e.g., Projector, AC, Whiteboard">
                <small>Comma-separated list</small>
            </div>
        `,
        timeslots: `
            <div class="form-group">
                <label><i class="fas fa-calendar-day"></i> Day</label>
                <select id="slot-day" required>
                    <option value="Monday" ${item?.day === 'Monday' ? 'selected' : ''}>Monday</option>
                    <option value="Tuesday" ${item?.day === 'Tuesday' ? 'selected' : ''}>Tuesday</option>
                    <option value="Wednesday" ${item?.day === 'Wednesday' ? 'selected' : ''}>Wednesday</option>
                    <option value="Thursday" ${item?.day === 'Thursday' ? 'selected' : ''}>Thursday</option>
                    <option value="Friday" ${item?.day === 'Friday' ? 'selected' : ''}>Friday</option>
                    <option value="Saturday" ${item?.day === 'Saturday' ? 'selected' : ''}>Saturday</option>
                </select>
            </div>
            <div class="form-group">
                <label><i class="fas fa-clock"></i> Start Time</label>
                <input type="time" id="slot-start" value="${item?.startTime || '09:00'}" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-clock"></i> End Time</label>
                <input type="time" id="slot-end" value="${item?.endTime || '10:00'}" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-hourglass-half"></i> Duration (minutes)</label>
                <input type="number" id="slot-duration" value="${item?.duration || 60}" min="15" max="180" step="15" required>
            </div>
        `
    };
    
    return forms[type] || '';
}

function generateTimeSlotOptions(selectedSlots = []) {
    const timeSlots = [
        { start: '08:00', end: '09:00', label: '8:00 AM - 9:00 AM' },
        { start: '09:00', end: '10:00', label: '9:00 AM - 10:00 AM' },
        { start: '10:00', end: '11:00', label: '10:00 AM - 11:00 AM' },
        { start: '11:00', end: '12:00', label: '11:00 AM - 12:00 PM' },
        { start: '12:00', end: '13:00', label: '12:00 PM - 1:00 PM' },
        { start: '13:00', end: '14:00', label: '1:00 PM - 2:00 PM' },
        { start: '14:00', end: '15:00', label: '2:00 PM - 3:00 PM' },
        { start: '15:00', end: '16:00', label: '3:00 PM - 4:00 PM' },
        { start: '16:00', end: '17:00', label: '4:00 PM - 5:00 PM' },
        { start: '17:00', end: '18:00', label: '5:00 PM - 6:00 PM' }
    ];
    
    return timeSlots.map((slot, index) => {
        const slotValue = `${slot.start}-${slot.end}`;
        const isChecked = selectedSlots.includes(slotValue);
        
        return `
            <label style="display: flex; align-items: center; gap: 0.5rem; background: rgba(255,255,255,0.1); padding: 0.5rem; border-radius: 0.5rem; cursor: pointer; font-size: 0.9rem;">
                <input type="checkbox" 
                    class="faculty-timeslot" 
                    value="${slotValue}" 
                    ${isChecked ? 'checked' : ''}
                    style="cursor: pointer;">
                <span>${slot.label}</span>
            </label>
        `;
    }).join('');
}

// ...existing code...

function handleFormSubmit(type, existingItem) {
    const handlers = {
        divisions: () => {
            const selectedOptions = document.getElementById('division-subjects').selectedOptions;
            const subjectIds = Array.from(selectedOptions).map(option => parseInt(option.value));
            
            const division = {
                id: existingItem?.id || Date.now(),
                name: document.getElementById('division-name').value.trim(),
                year: document.getElementById('division-year').value,
                studentCount: parseInt(document.getElementById('division-students').value),
                subjects: subjectIds
            };
            
            if (existingItem) {
                const index = divisions.findIndex(d => d.id === existingItem.id);
                if (index !== -1) divisions[index] = division;
            } else {
                divisions.push(division);
            }
            
            localStorage.setItem('divisions', JSON.stringify(divisions));
            renderDivisions();
        },
        subjects: () => {
            const subject = {
                id: existingItem?.id || Date.now(),
                code: document.getElementById('subject-code').value.trim(),
                name: document.getElementById('subject-name').value.trim(),
                hours: parseInt(document.getElementById('subject-hours').value),
                type: document.getElementById('subject-type').value
            };
            
            if (existingItem) {
                const index = subjects.findIndex(s => s.id === existingItem.id);
                if (index !== -1) subjects[index] = subject;
            } else {
                subjects.push(subject);
            }
            
            localStorage.setItem('subjects', JSON.stringify(subjects));
            renderSubjects();
        },
        faculty: () => {
            const availableDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                .filter(day => document.getElementById(`faculty-day-${day}`)?.checked);
            
            // Get selected time slots
            const availableTimeSlots = Array.from(document.querySelectorAll('.faculty-timeslot:checked'))
                .map(checkbox => checkbox.value);
            
            const member = {
                id: existingItem?.id || Date.now(),
                name: document.getElementById('faculty-name').value.trim(),
                employeeId: document.getElementById('faculty-id').value.trim(),
                department: document.getElementById('faculty-dept').value.trim(),
                email: document.getElementById('faculty-email').value.trim(),
                maxHours: parseInt(document.getElementById('faculty-hours').value),
                availableDays: availableDays,
                availableTimeSlots: availableTimeSlots
            };
            
            if (existingItem) {
                const index = faculty.findIndex(f => f.id === existingItem.id);
                if (index !== -1) faculty[index] = member;
            } else {
                faculty.push(member);
            }
            
            localStorage.setItem('faculty', JSON.stringify(faculty));
            renderFaculty();
        },
        rooms: () => {
            const room = {
                id: existingItem?.id || Date.now(),
                number: document.getElementById('room-number').value.trim(),
                building: document.getElementById('room-building').value.trim(),
                capacity: parseInt(document.getElementById('room-capacity').value),
                type: document.getElementById('room-type').value,
                facilities: document.getElementById('room-facilities').value.trim()
            };
            
            if (existingItem) {
                const index = rooms.findIndex(r => r.id === existingItem.id);
                if (index !== -1) rooms[index] = room;
            } else {
                rooms.push(room);
            }
            
            localStorage.setItem('rooms', JSON.stringify(rooms));
            renderRooms();
        },
        timeslots: () => {
            const slot = {
                id: existingItem?.id || Date.now(),
                day: document.getElementById('slot-day').value,
                startTime: document.getElementById('slot-start').value,
                endTime: document.getElementById('slot-end').value,
                duration: parseInt(document.getElementById('slot-duration').value)
            };
            
            if (existingItem) {
                const index = timeslots.findIndex(t => t.id === existingItem.id);
                if (index !== -1) timeslots[index] = slot;
            } else {
                timeslots.push(slot);
            }
            
            localStorage.setItem('timeslots', JSON.stringify(timeslots));
            renderTimeslots();
        }
    };
    
    if (handlers[type]) {
        handlers[type]();
        closeModal();
        console.log(`${type} saved successfully`);
    }
}

// ===== EDIT ITEM =====
function editItem(type, index) {
    const items = {
        subjects: subjects[index],
        faculty: faculty[index],
        rooms: rooms[index],
        timeslots: timeslots[index],
        divisions: divisions[index]
    };
    
    openModal(type, items[type]);
}

// ===== DELETE FUNCTIONS =====
function deleteItem(type, id) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    const deleters = {
        divisions: () => {
            divisions = divisions.filter(d => d.id !== id);
            localStorage.setItem('divisions', JSON.stringify(divisions));
            renderDivisions();
        },
        subjects: () => {
            subjects = subjects.filter(s => s.id !== id);
            localStorage.setItem('subjects', JSON.stringify(subjects));
            renderSubjects();
        },
        faculty: () => {
            faculty = faculty.filter(f => f.id !== id);
            localStorage.setItem('faculty', JSON.stringify(faculty));
            renderFaculty();
        },
        rooms: () => {
            rooms = rooms.filter(r => r.id !== id);
            localStorage.setItem('rooms', JSON.stringify(rooms));
            renderRooms();
        },
        timeslots: () => {
            timeslots = timeslots.filter(t => t.id !== id);
            localStorage.setItem('timeslots', JSON.stringify(timeslots));
            renderTimeslots();
        },
        timetables: () => {
            timetables = timetables.filter(t => t.id !== id);
            localStorage.setItem('timetables', JSON.stringify(timetables));
            renderTimetables();
        }
    };
    
    if (deleters[type]) {
        deleters[type]();
        console.log(`${type} item deleted successfully`);
    }
}

// ===== NAVIGATION FUNCTIONS =====
function navigateToGenerate() {
    console.log('Navigating to generate page');
    
    // Get all tab buttons and pages
    const tabButtons = document.querySelectorAll('.tab-nav-btn');
    const tabPages = document.querySelectorAll('.tab-page');
    
    // Remove active class from all buttons
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Hide all pages
    tabPages.forEach(page => {
        page.classList.remove('active');
        page.style.display = 'none';
    });
    
    // Show generate page
    const generatePage = document.getElementById('generate-page');
    if (generatePage) {
        generatePage.classList.add('active');
        generatePage.style.display = 'block';
        console.log('Generate page activated');
    } else {
        console.error('Generate page not found');
    }
}

// ===== VIEW TIMETABLE =====
function viewTimetable(id) {
    const timetable = timetables.find(t => t.id === id);
    if (!timetable) {
        alert('Timetable not found!');
        return;
    }
    const modal = document.getElementById('modal-overlay');
    const modalContainer = modal.querySelector('.modal-container');

    // Generate sample schedule if it doesn't exist
    if (!timetable.schedule) {
        timetable.schedule = generateSampleSchedule();
        localStorage.setItem('timetables', JSON.stringify(timetables));
    }

    // Add fullscreen classes
    modal.classList.add('fullscreen-modal');
    modalContainer.classList.add('fullscreen-modal');

    modalContainer.innerHTML = `
        <button class="modal-close" onclick="closeModal()"><i class="fas fa-times"></i></button>
        <div class="modal-header">
            <h2><i class="fas fa-calendar-check"></i> ${timetable.name}</h2>
            <p>Fitness Score: ${timetable.fitness}% | Created: ${new Date(timetable.createdAt).toLocaleDateString()}</p>
        </div>
        <div class="schedule-table">
            ${generateScheduleTable(timetable.schedule)}
        </div>
        <div class="modal-actions">
            <button class="btn-modal-primary" onclick="downloadTimetable(${id})">
                <i class="fas fa-download"></i> Download
            </button>
            <button class="btn-modal-secondary" onclick="printTimetable(${id})">
                <i class="fas fa-print"></i> Print
            </button>
            <button class="btn-modal-secondary" onclick="closeModal()">
                <i class="fas fa-times"></i> Close
            </button>
        </div>
    `;
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('modal-overlay');
    const modalContainer = modal.querySelector('.modal-container');
    modal.classList.remove('active', 'fullscreen-modal');
    modalContainer.classList.remove('fullscreen-modal');
    // Optionally restore modalContainer content if needed
}

// ===== GENERATE SAMPLE SCHEDULE =====
function generateSampleSchedule() {
    if (divisions.length === 0) {
        alert('Please add at least one division before generating timetables.');
        return null;
    }
    
    const allSchedules = [];
    
    divisions.forEach(division => {
        const divisionSchedule = generateDivisionSchedule(division);
        allSchedules.push(...divisionSchedule);
    });
    
    // Check for faculty clashes
    const clashes = checkFacultyClash(allSchedules);
    if (clashes.length > 0) {
        console.warn('Faculty clashes detected:', clashes);
    }
    
    return allSchedules;
}

function generateDivisionSchedule(division) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const timeSlots = [
        { start: '09:00', end: '10:00' },
        { start: '10:00', end: '11:00' },
        { start: '11:00', end: '12:00' },
        { start: '12:00', end: '01:00' },
        { start: '02:00', end: '03:00' },
        { start: '03:00', end: '04:00' }
    ];
    
    const schedule = [];
    const divisionSubjects = subjects.filter(s => division.subjects?.includes(s.id));
    
    if (divisionSubjects.length === 0) {
        console.warn(`No subjects assigned to division ${division.name}`);
        return schedule;
    }
    
    days.forEach(day => {
        timeSlots.forEach((slot, index) => {
            // Lunch break
            if (slot.start === '12:00') {
                schedule.push({
                    division: division.name,
                    divisionId: division.id,
                    day,
                    timeSlot: `${slot.start} - ${slot.end}`,
                    subject: 'LUNCH BREAK',
                    faculty: '-',
                    room: '-',
                    type: 'break'
                });
                return;
            }
            
            // Assign subject
            const subject = divisionSubjects[Math.floor(Math.random() * divisionSubjects.length)];
            
            // Find available faculty for this subject on this day
            const availableFaculty = faculty.filter(f => 
                f.availableDays?.includes(day) || !f.availableDays || f.availableDays.length === 0
            );
            
            const facultyMember = availableFaculty.length > 0
                ? availableFaculty[Math.floor(Math.random() * availableFaculty.length)]
                : { name: 'TBA', employeeId: 'N/A' };
            
            // Find suitable room
            const suitableRooms = rooms.filter(r => 
                r.capacity >= division.studentCount &&
                (subject.type === 'lab' ? r.type === 'lab' : r.type === 'classroom' || r.type === 'lab')
            );
            
            const room = suitableRooms.length > 0
                ? suitableRooms[Math.floor(Math.random() * suitableRooms.length)]
                : { number: 'TBA', building: 'N/A', type: 'classroom' };
            
            schedule.push({
                division: division.name,
                divisionId: division.id,
                day,
                timeSlot: `${slot.start} - ${slot.end}`,
                subject: `${subject.code} - ${subject.name}`,
                faculty: facultyMember.name,
                facultyId: facultyMember.id,
                room: `${room.number} (${room.building})`,
                roomId: room.id,
                type: subject.type
            });
        });
    });
    
    return schedule;
}

// ===== FACULTY CLASH DETECTION =====
function checkFacultyClash(schedule) {
    const clashes = [];
    const facultySchedule = {};
    
    schedule.forEach(entry => {
        if (entry.type === 'break') return;
        
        const key = `${entry.faculty}-${entry.day}-${entry.timeSlot}`;
        
        if (facultySchedule[key]) {
            clashes.push({
                faculty: entry.faculty,
                day: entry.day,
                timeSlot: entry.timeSlot,
                divisions: [facultySchedule[key].division, entry.division]
            });
        } else {
            facultySchedule[key] = entry;
        }
    });
    
    return clashes;
}

// ===== GENERATE SCHEDULE (UPDATE) =====
function generateSchedule() {
    const populationSize = document.getElementById('population-size').value;
    const generations = document.getElementById('generations').value;
    const mutationRate = document.getElementById('mutation-rate').value;
    
    // Validate data exists
    if (subjects.length === 0) {
        alert('Please add at least one subject before generating a timetable.');
        return;
    }
    if (faculty.length === 0) {
        alert('Please add at least one faculty member before generating a timetable.');
        return;
    }
    if (rooms.length === 0) {
        alert('Please add at least one room before generating a timetable.');
        return;
    }
    if (timeslots.length === 0) {
        alert('Please add at least one time slot before generating a timetable.');
        return;
    }
    
    // Show progress
    document.getElementById('progress').classList.remove('hidden');
    document.getElementById('results').classList.add('hidden');
    
    // Simulate generation
    setTimeout(() => {
        const newTimetable = {
            id: Date.now(),
            name: `Timetable ${timetables.length + 1}`,
            status: 'completed',
            fitness: Math.floor(Math.random() * 20) + 80,
            createdAt: Date.now(),
            populationSize,
            generations,
            mutationRate,
            schedule: generateSampleSchedule() // Generate the schedule immediately
        };
        
        timetables.push(newTimetable);
        localStorage.setItem('timetables', JSON.stringify(timetables));
        
        document.getElementById('progress').classList.add('hidden');
        
        // Show the generated schedule in results
        displayGeneratedSchedule(newTimetable);
        document.getElementById('results').classList.remove('hidden');
        
        // Show success message
        setTimeout(() => {
            alert('Timetable generated successfully! You can view it in the Timetables tab.');
            
            // Switch back to timetables tab
            const tabButtons = document.querySelectorAll('.tab-nav-btn');
            const tabPages = document.querySelectorAll('.tab-page');
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPages.forEach(page => {
                page.classList.remove('active');
                page.style.display = 'none';
            });
            
            // Activate timetables tab
            const timetablesBtn = document.querySelector('[data-page="timetables"]');
            const timetablesPage = document.getElementById('timetables-page');
            
            if (timetablesBtn) timetablesBtn.classList.add('active');
            if (timetablesPage) {
                timetablesPage.classList.add('active');
                timetablesPage.style.display = 'block';
            }
            
            renderTimetables();
        }, 1000);
    }, 3000);
}

// ===== DISPLAY GENERATED SCHEDULE =====
function displayGeneratedSchedule(timetable) {
    const scheduleTableDiv = document.getElementById('schedule-table');
    if (scheduleTableDiv) {
        scheduleTableDiv.innerHTML = generateScheduleTable(timetable.schedule);
    }
    
    // You can also add a fitness chart here if needed
    const canvas = document.getElementById('fitness-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw a simple fitness evolution chart
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const generations = 20;
        const width = canvas.width;
        const height = canvas.height;
        
        for (let i = 0; i <= generations; i++) {
            const x = (i / generations) * width;
            const fitness = 60 + (timetable.fitness - 60) * (i / generations) + Math.random() * 5;
            const y = height - (fitness / 100) * height;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        
        // Add text
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.fillText(`Final Fitness: ${timetable.fitness}%`, 10, 30);
    }
}

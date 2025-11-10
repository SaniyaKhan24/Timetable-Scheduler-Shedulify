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

// Add after other global variables
let resourceTracker = null;

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
    
    // Inline header HTML as fallback
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
                    <a href="dashboard.html" class="btn btn-nav"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
                </div>
            </div>
        </nav>
    `;

    const footerHTML = `
        <footer class="site-footer">
            <p>&copy; 2024 Schedulify. All rights reserved.</p>
        </footer>
    `;

    try {
        // Try to load from external files first
        const [hdrResp, ftrResp] = await Promise.all([
            fetch('./components/header.html').catch(() => null),
            fetch('./components/footer.html').catch(() => null)
        ]);
        
        const holder = document.getElementById('site-header');
        if (holder) {
            if (hdrResp && hdrResp.ok) {
                const headerText = await hdrResp.text();
                holder.innerHTML = headerText;
                console.log('✅ Header loaded from file');
            } else {
                // Use inline HTML as fallback
                holder.innerHTML = headerHTML;
                console.log('✅ Header loaded from inline HTML');
            }
        }
        
        const fHolder = document.getElementById('site-footer');
        if (fHolder) {
            if (ftrResp && ftrResp.ok) {
                const footerText = await ftrResp.text();
                fHolder.innerHTML = footerText;
                console.log('✅ Footer loaded from file');
            } else {
                // Use inline HTML as fallback
                fHolder.innerHTML = footerHTML;
                console.log('✅ Footer loaded from inline HTML');
            }
        }
        
        // Add logo click handler
        const logo = document.getElementById('logo-link');
        if (logo) {
            logo.addEventListener('click', () => {
                window.location.href = 'index.html';
            });
        }
        
        // Highlight active nav link
        const path = window.location.pathname.split('/').pop() || 'index.html';
        document.querySelectorAll('.site-header .nav-link').forEach(a => {
            const href = a.getAttribute('href') || '';
            if (href.includes(path) || href.split('#')[0] === path) {
                a.classList.add('active');
            }
        });
    } catch (err) {
        console.warn('⚠️ Header/footer load failed, using inline HTML:', err);
        // Fallback to inline HTML
        const holder = document.getElementById('site-header');
        if (holder) holder.innerHTML = headerHTML;
        
        const fHolder = document.getElementById('site-footer');
        if (fHolder) fHolder.innerHTML = footerHTML;
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded');
    loadHeaderFooter(); // Use loadHeaderFooter instead of loadHeader
    initializeTabs();
    renderAllData();
});

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
    
    // Group subjects by base code
    const groupedSubjects = {};
    subjects.forEach(subject => {
        const base = subject.baseCode || subject.code.split('-')[0];
        if (!groupedSubjects[base]) {
            groupedSubjects[base] = [];
        }
        groupedSubjects[base].push(subject);
    });
    
    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th><i class="fas fa-code"></i> Code</th>
                    <th><i class="fas fa-book"></i> Name</th>
                    <th><i class="fas fa-layer-group"></i> Type</th>
                    <th><i class="fas fa-clock"></i> Hours/Week</th>
                    <th><i class="fas fa-info-circle"></i> Details</th>
                    <th><i class="fas fa-cog"></i> Actions</th>
                </tr>
            </thead>
            <tbody>
                ${Object.entries(groupedSubjects).map(([baseCode, subjectGroup]) => {
                    if (subjectGroup.length === 1) {
                        // Single entry subject
                        const subject = subjectGroup[0];
                        const index = subjects.indexOf(subject);
                        return `
                            <tr>
                                <td><strong>${escapeHtml(subject.code)}</strong></td>
                                <td>${escapeHtml(subject.name)}</td>
                                <td><span style="text-transform: capitalize;">${subject.type}</span></td>
                                <td>${subject.hours}</td>
                                <td>${subject.hourPerSession ? `${subject.hourPerSession}h per session` : '-'}</td>
                                <td>
                                    <button class="btn btn-secondary" style="padding: 0.5rem 1rem; margin-right: 0.5rem;" onclick="editItem('subjects', ${index})">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-secondary" style="padding: 0.5rem 1rem;" onclick="deleteItem('subjects', ${subject.id})">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `;
                    } else {
                        // Multiple entries for same subject
                        const baseName = subjectGroup[0].baseName || subjectGroup[0].name.split('(')[0].trim();
                        const totalHours = subjectGroup.reduce((sum, s) => sum + s.hours, 0);
                        return `
                            <tr style="background: rgba(168,85,247,0.1);">
                                <td rowspan="${subjectGroup.length + 1}"><strong>${escapeHtml(baseCode)}</strong></td>
                                <td rowspan="${subjectGroup.length + 1}"><strong>${escapeHtml(baseName)}</strong></td>
                                <td colspan="4" style="padding: 0.5rem 1rem; font-weight: 600; color: #a855f7;">
                                    <i class="fas fa-layer-group"></i> Multi-session Subject (Total: ${totalHours} hrs/week)
                                </td>
                            </tr>
                            ${subjectGroup.map((subject, idx) => {
                                const index = subjects.indexOf(subject);
                                return `
                                    <tr>
                                        <td><span style="text-transform: capitalize; background: rgba(168,85,247,0.2); padding: 0.3rem 0.6rem; border-radius: 0.3rem;">${subject.type}</span></td>
                                        <td>${subject.hours} hrs</td>
                                        <td>${subject.hourPerSession}h per session</td>
                                        <td>
                                            ${idx === 0 ? `
                                                <button class="btn btn-secondary" style="padding: 0.5rem 1rem; margin-right: 0.5rem;" onclick="deleteSubjectGroup('${baseCode}')">
                                                    <i class="fas fa-trash"></i> Delete All
                                                </button>
                                            ` : ''}
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        `;
                    }
                }).join('')}
            </tbody>
        </table>
    `;
}

// Add function to delete entire subject group
window.deleteSubjectGroup = function(baseCode) {
    if (!confirm(`Delete all sessions for ${baseCode}?`)) return;
    
    subjects = subjects.filter(s => (s.baseCode || s.code.split('-')[0]) !== baseCode);
    localStorage.setItem('subjects', JSON.stringify(subjects));
    renderSubjects();
    console.log(`All sessions for ${baseCode} deleted`);
};

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
                    <th><i class="fas fa-envelope"></i> Email</th>
                    <th><i class="fas fa-book"></i> Subjects</th>
                    <th><i class="fas fa-layer-group"></i> Divisions</th>
                    <th><i class="fas fa-graduation-cap"></i> Year</th>
                    <th><i class="fas fa-clock"></i> Max Hours</th>
                    <th><i class="fas fa-calendar"></i> Availability</th>
                    <th><i class="fas fa-cog"></i> Actions</th>
                </tr>
            </thead>
            <tbody>
                ${faculty.map((member, index) => {
                    // Get subject names
                    const subjectNames = member.subjects?.map(subId => {
                        const subject = subjects.find(s => s.id === subId);
                        return subject ? subject.name : 'Unknown';
                    }) || [];
                    
                    // Get division names
                    const divisionNames = member.divisions?.map(divId => {
                        const division = divisions.find(d => d.id === divId);
                        return division ? division.name : 'Unknown';
                    }) || [];
                    
                    // Get year name
                    const yearNames = {
                        '1': 'First Year',
                        '2': 'Second Year',
                        '3': 'Third Year',
                        '4': 'Fourth Year'
                    };
                    const yearName = yearNames[member.year] || 'Not assigned';
                    
                    // ✅ FIX: Calculate total slots correctly
                    let totalSlots = 0;
                    let totalDays = 0;
                    
                    if (member.availableTimeSlots) {
                        if (typeof member.availableTimeSlots === 'object' && !Array.isArray(member.availableTimeSlots)) {
                            // New format: object with days as keys
                            totalDays = Object.keys(member.availableTimeSlots).length;
                            totalSlots = Object.values(member.availableTimeSlots).reduce((sum, slots) => sum + slots.length, 0);
                        } else if (Array.isArray(member.availableTimeSlots)) {
                            // Old format: array of time slots
                            totalSlots = member.availableTimeSlots.length;
                            totalDays = member.availableDays?.length || 0;
                        }
                    }
                    
                    return `
                        <tr>
                            <td><strong>${escapeHtml(member.name)}</strong></td>
                            <td>${escapeHtml(member.employeeId)}</td>
                            <td>${escapeHtml(member.department)}</td>
                            <td><small>${escapeHtml(member.email || 'N/A')}</small></td>
                            <td>
                                ${subjectNames.length > 0 
                                    ? subjectNames.map(name => `<span style="display: inline-block; background: rgba(255,255,255,0.15); padding: 0.2rem 0.5rem; border-radius: 0.3rem; margin: 0.1rem; font-size: 0.85rem;">${escapeHtml(name)}</span>`).join('')
                                    : '<small style="color: rgba(255,255,255,0.5);">None</small>'
                                }
                            </td>
                            <td>
                                ${divisionNames.length > 0 
                                    ? divisionNames.map(name => `<span style="display: inline-block; background: rgba(168,85,247,0.2); padding: 0.2rem 0.5rem; border-radius: 0.3rem; margin: 0.1rem; font-size: 0.85rem;">${escapeHtml(name)}</span>`).join('')
                                    : '<small style="color: rgba(255,255,255,0.5);">None</small>'
                                }
                            </td>
                            <td><strong>${yearName}</strong></td>
                            <td>${member.maxHours}/week</td>
                            <td>
                                <small style="display: block; margin-bottom: 0.25rem;">
                                    <strong>Days:</strong> ${totalDays} days
                                </small>
                                <small style="display: block;">
                                    <strong>Slots:</strong> ${totalSlots} slots
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
                    `;
                }).join('')}
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
                    <th><i class="fas fa-hourglass-half"></i> Total Hours</th>
                    <th><i class="fas fa-info-circle"></i> Description</th>
                    <th><i class="fas fa-cog"></i> Actions</th>
                </tr>
            </thead>
            <tbody>
                ${timeslots.map((slot, index) => {
                    const hours = calculateHoursDifference(slot.startTime, slot.endTime);
                    return `
                        <tr>
                            <td><strong>${slot.day}</strong></td>
                            <td>${formatTime(slot.startTime)}</td>
                            <td>${formatTime(slot.endTime)}</td>
                            <td><strong>${hours} hours</strong></td>
                            <td>${slot.description || 'Regular class hours'}</td>
                            <td>
                                <button class="btn btn-secondary" style="padding: 0.5rem 1rem; margin-right: 0.5rem;" onclick="editItem('timeslots', ${index})">
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button class="btn btn-secondary" style="padding: 0.5rem 1rem;" onclick="deleteItem('timeslots', ${slot.id})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

// Helper function to calculate hours difference
function calculateHoursDifference(startTime, endTime) {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    const diffMinutes = endMinutes - startMinutes;
    return (diffMinutes / 60).toFixed(1);
}

// Helper function to format time
function formatTime(time) {
    const [hour, min] = time.split(':');
    const h = parseInt(hour);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${displayHour}:${min} ${period}`;
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
    currentEditIndex = isEdit ? getItemIndex(type, item) : null;
    
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
        saveModalForm(type, item);
    };
    
    modal.classList.add('active');
}

function getItemIndex(type, item) {
    const arrays = { subjects, faculty, rooms, timeslots, divisions };
    return arrays[type]?.indexOf(item) ?? -1;
}

function closeModal() {
    const modal = document.getElementById('modal-overlay');
    const modalContainer = modal.querySelector('.modal-container');
    modal.classList.remove('active', 'fullscreen-modal');
    modalContainer.classList.remove('fullscreen-modal');
    document.getElementById('modal-form').reset();
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
                    <option value="1" ${item?.year === '1' || item?.year === 1 ? 'selected' : ''}>First Year</option>
                    <option value="2" ${item?.year === '2' || item?.year === 2 ? 'selected' : ''}>Second Year</option>
                    <option value="3" ${item?.year === '3' || item?.year === 3 ? 'selected' : ''}>Third Year</option>
                    <option value="4" ${item?.year === '4' || item?.year === 4 ? 'selected' : ''}>Fourth Year</option>
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
                <input type="text" id="subject-code" value="${item?.code || item?.baseCode || ''}" placeholder="e.g., CS101" required>
                <small>Base code for this subject (suffixes will be added automatically)</small>
            </div>
            <div class="form-group">
                <label><i class="fas fa-heading"></i> Subject Name</label>
                <input type="text" id="subject-name" value="${item?.name || item?.baseName || ''}" placeholder="e.g., Data Structures" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-layer-group"></i> Session Types</label>
                <div style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
                    <label style="display: flex; align-items: center; margin-bottom: 0.75rem; cursor: pointer;">
                        <input type="checkbox" id="type-theory" onchange="toggleSessionHours('theory')" 
                               ${item?.type === 'theory' ? 'checked' : ''} 
                               style="margin-right: 0.75rem; width: 18px; height: 18px; cursor: pointer;">
                        <span style="font-weight: 600;"><i class="fas fa-book-open"></i> Theory Sessions (1 hour each)</span>
                    </label>
                    <div id="theory-hours-container" style="display: ${item?.type === 'theory' ? 'block' : 'none'}; margin-left: 2rem; margin-bottom: 1rem;">
                        <label style="font-size: 0.9rem; color: rgba(255,255,255,0.8);">Sessions per week:</label>
                        <input type="number" id="theory-hours" min="1" max="10" value="${item?.type === 'theory' ? item.hours : 3}" style="width: 100px; margin-left: 0.5rem; padding: 0.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 0.5rem; color: white;">
                    </div>
                    
                    <label style="display: flex; align-items: center; margin-bottom: 0.75rem; cursor: pointer;">
                        <input type="checkbox" id="type-lab" onchange="toggleSessionHours('lab')" 
                               ${item?.type === 'lab' ? 'checked' : ''} 
                               style="margin-right: 0.75rem; width: 18px; height: 18px; cursor: pointer;">
                        <span style="font-weight: 600;"><i class="fas fa-flask"></i> Lab Sessions (2 hours each)</span>
                    </label>
                    <div id="lab-hours-container" style="display: ${item?.type === 'lab' ? 'block' : 'none'}; margin-left: 2rem; margin-bottom: 1rem;">
                        <label style="font-size: 0.9rem; color: rgba(255,255,255,0.8);">Sessions per week:</label>
                        <input type="number" id="lab-hours" min="1" max="5" value="${item?.type === 'lab' ? item.hours : 1}" style="width: 100px; margin-left: 0.5rem; padding: 0.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 0.5rem; color: white;">
                    </div>
                    
                    <label style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="type-tutorial" onchange="toggleSessionHours('tutorial')" 
                               ${item?.type === 'tutorial' ? 'checked' : ''} 
                               style="margin-right: 0.75rem; width: 18px; height: 18px; cursor: pointer;">
                        <span style="font-weight: 600;"><i class="fas fa-chalkboard-teacher"></i> Tutorial Sessions (1 hour each)</span>
                    </label>
                    <div id="tutorial-hours-container" style="display: ${item?.type === 'tutorial' ? 'block' : 'none'}; margin-left: 2rem;">
                        <label style="font-size: 0.9rem; color: rgba(255,255,255,0.8);">Sessions per week:</label>
                        <input type="number" id="tutorial-hours" min="1" max="5" value="${item?.type === 'tutorial' ? item.hours : 1}" style="width: 100px; margin-left: 0.5rem; padding: 0.5rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 0.5rem; color: white;">
                    </div>
                </div>
                <small style="color: rgba(255,255,255,0.7);">Select all applicable session types. Total hours will be calculated automatically.</small>
            </div>
            <div class="form-group">
                <div style="background: rgba(168,85,247,0.15); padding: 1rem; border-radius: 0.5rem; border-left: 3px solid #a855f7;">
                    <p style="margin: 0; font-size: 0.9rem; color: rgba(255,255,255,0.9);">
                        <i class="fas fa-info-circle"></i> 
                        <strong>Note:</strong> ${item ? 'Editing will update all components of this subject.' : 'Multiple components will be created as separate entries.'}
                    </p>
                </div>
            </div>
        `,
        faculty: `
            <div class="form-group">
                <label><i class="fas fa-user"></i> Faculty Name</label>
                <input type="text" id="faculty-name" value="${escapeHtml(item?.name || '')}" placeholder="e.g., Ass. Prof. Gitanjali Yadav" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-id-badge"></i> Employee ID</label>
                <input type="text" id="faculty-id" value="${escapeHtml(item?.employeeId || '')}" placeholder="e.g., FAC001" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-graduation-cap"></i> Department</label>
                <input type="text" id="faculty-dept" value="${escapeHtml(item?.department || '')}" placeholder="e.g., Computer Science" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-envelope"></i> Email</label>
                <input type="email" id="faculty-email" value="${escapeHtml(item?.email || '')}" placeholder="e.g., gitanjali.yadav@university.edu">
            </div>
            <div class="form-group">
                <label><i class="fas fa-clock"></i> Max Hours per Week</label>
                <input type="number" id="faculty-hours" value="${item?.maxHours || 35}" min="1" max="50" required>
                <small>Maximum teaching hours per week</small>
            </div>
            
            <div class="form-group">
                <label><i class="fas fa-calendar-week"></i> Weekly Availability</label>
                <small style="display: block; margin-bottom: 1rem; color: rgba(255,255,255,0.8);">
                    Select days and time slots when faculty is available
                </small>
                ${generateDayWiseTimeSlotGrid(item?.availableTimeSlots || {})}
            </div>
            
            <div class="form-group">
                <label><i class="fas fa-book"></i> Assign Subjects</label>
                <select id="faculty-subjects" multiple style="min-height: 120px;">
                    ${subjects.map(subject => `
                        <option value="${subject.id}" ${item?.subjects?.includes(subject.id) ? 'selected' : ''}>
                            ${subject.code} - ${subject.name}
                        </option>
                    `).join('')}
                </select>
                <small>Hold Ctrl/Cmd to select multiple subjects</small>
            </div>
            <div class="form-group">
                <label><i class="fas fa-layer-group"></i> Assign Divisions</label>
                <select id="faculty-divisions" multiple style="min-height: 120px;">
                    ${divisions.map(division => `
                        <option value="${division.id}" ${item?.divisions?.includes(division.id) ? 'selected' : ''}>
                            ${division.name} - Year ${division.year}
                        </option>
                    `).join('')}
                </select>
                <small>Hold Ctrl/Cmd to select multiple divisions</small>
            </div>
            <div class="form-group">
                <label><i class="fas fa-graduation-cap"></i> Assign Year</label>
                <select id="faculty-year" required>
                    <option value="1" ${item?.year === '1' || item?.year === 1 ? 'selected' : ''}>First Year</option>
                    <option value="2" ${item?.year === '2' || item?.year === 2 ? 'selected' : ''}>Second Year</option>
                    <option value="3" ${item?.year === '3' || item?.year === 3 ? 'selected' : ''}>Third Year</option>
                    <option value="4" ${item?.year === '4' || item?.year === 4 ? 'selected' : ''}>Fourth Year</option>
                </select>
            </div>
        `,
        rooms: `
            <div class="form-group">
                <label><i class="fas fa-door-open"></i> Room Number</label>
                <input type="text" id="room-number" value="${escapeHtml(item?.number || '')}" placeholder="e.g., 201" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-building"></i> Building</label>
                <input type="text" id="room-building" value="${escapeHtml(item?.building || '')}" placeholder="e.g., Main Block" required>
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
                <input type="text" id="room-facilities" value="${Array.isArray(item?.facilities) ? item.facilities.join(', ') : (item?.facilities || '')}" placeholder="e.g., Projector, AC, Whiteboard">
                <small>Comma-separated list</small>
            </div>
        `,
        timeslots: `
            <div class="form-group">
                <label><i class="fas fa-calendar-day"></i> Day</label>
                <select id="slot-day" required>
                    <option value="">Select a day</option>
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
                <input type="time" id="slot-start" value="${item?.startTime || '08:00'}" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-clock"></i> End Time</label>
                <input type="time" id="slot-end" value="${item?.endTime || '15:00'}" required>
            </div>
            <div class="form-group">
                <label><i class="fas fa-info-circle"></i> Description (Optional)</label>
                <input type="text" id="slot-description" value="${escapeHtml(item?.description || '')}" placeholder="e.g., Regular class hours">
            </div>
        `
    };
    
    return forms[type] || '';
}

// ===== DELETE ITEM FUNCTION =====
window.deleteItem = async function(type, id) {
    console.log(`🗑️ Deleting ${type} with id ${id}`);
    
    const confirmMessage = `Are you sure you want to delete this ${type.slice(0, -1)}?`;
    if (!confirm(confirmMessage)) {
        return;
    }
    
    try {
        // Show loading state
        const btn = event?.target?.closest('button');
        const originalHTML = btn?.innerHTML;
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }
        
        // Delete from localStorage
        const arrays = {
            'timetables': timetables,
            'divisions': divisions,
            'subjects': subjects,
            'faculty': faculty,
            'rooms': rooms,
            'timeslots': timeslots
        };
        
        const array = arrays[type];
        if (array) {
            const index = array.findIndex(item => item.id === id);
            if (index !== -1) {
                array.splice(index, 1);
                
                // Update localStorage
                localStorage.setItem(type, JSON.stringify(array));
                
                console.log(`✅ Deleted ${type} id=${id}`);
                
                // Re-render
                renderAllData();
                
                // Show success message
                showNotification(`${type.slice(0, -1)} deleted successfully!`, 'success');
            } else {
                showNotification(`${type.slice(0, -1)} not found`, 'error');
            }
        }
        
        // Restore button
        if (btn && originalHTML) {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    } catch (error) {
        console.error(`❌ Error deleting ${type}:`, error);
        showNotification(`Error deleting ${type.slice(0, -1)}: ${error.message}`, 'error');
        
        // Restore button
        const btn = event?.target?.closest('button');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-trash"></i>';
        }
    }
};

// ===== NOTIFICATION SYSTEM =====
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
    `;
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 0.75rem;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" style="margin-left: auto; background: none; border: none; color: white; cursor: pointer; font-size: 1.2rem;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Add CSS animation
if (!document.getElementById('notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(400px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// ===== CRUD FUNCTIONS =====
function saveModalForm(type, item) {
    console.log(`💾 Saving ${type}...`, item ? 'EDIT' : 'NEW');
    
    let isEdit = !!item;

    // Gather form data
    let newItem = {};
    if (type === 'divisions') {
        newItem = {
            id: isEdit ? item.id : Date.now(),
            name: document.getElementById('division-name').value.trim(),
            year: document.getElementById('division-year').value,
            studentCount: parseInt(document.getElementById('division-students').value),
            subjects: Array.from(document.getElementById('division-subjects').selectedOptions).map(opt => parseInt(opt.value))
        };
        
        // Update or add to divisions array
        if (isEdit) {
            const index = divisions.findIndex(d => d.id === item.id);
            if (index !== -1) divisions[index] = newItem;
        } else {
            divisions.push(newItem);
        }
        
    } else if (type === 'subjects') {
        // Gather all checked session types
        let code = document.getElementById('subject-code').value.trim();
        let name = document.getElementById('subject-name').value.trim();
        let sessionTypes = [];
        
        if (document.getElementById('type-theory').checked) {
            sessionTypes.push({
                type: 'theory',
                hours: parseInt(document.getElementById('theory-hours').value),
                hourPerSession: 1
            });
        }
        if (document.getElementById('type-lab').checked) {
            sessionTypes.push({
                type: 'lab',
                hours: parseInt(document.getElementById('lab-hours').value),
                hourPerSession: 2
            });
        }
        if (document.getElementById('type-tutorial').checked) {
            sessionTypes.push({
                type: 'tutorial',
                hours: parseInt(document.getElementById('tutorial-hours').value),
                hourPerSession: 1
            });
        }
        
        // Validate at least one session type is selected
        if (sessionTypes.length === 0) {
            showNotification('Please select at least one session type', 'error');
            return;
        }
        
        // Remove old subject group if editing
        if (isEdit) {
            let baseCode = item.baseCode || item.code.split('-')[0];
            subjects = subjects.filter(s => (s.baseCode || s.code.split('-')[0]) !== baseCode);
        }
        
        // Add each session type as a separate subject entry
        sessionTypes.forEach((sessionType, idx) => {
            let suffix = '';
            if (sessionType.type === 'theory') suffix = '-T';
            else if (sessionType.type === 'lab') suffix = '-L';
            else if (sessionType.type === 'tutorial') suffix = '-Tut';
            
            const newCode = sessionTypes.length > 1 ? `${code}${suffix}` : code;
            const newSubject = {
                id: Date.now() + idx,
                code: newCode,
                name: sessionTypes.length > 1 ? `${name} (${sessionType.type.charAt(0).toUpperCase() + sessionType.type.slice(1)})` : name,
                type: sessionType.type,
                hours: sessionType.hours,
                hourPerSession: sessionType.hourPerSession,
                baseCode: code,
                baseName: name
            };
            subjects.push(newSubject);
            console.log('✅ Added subject:', newSubject);
        });
        
    } else if (type === 'faculty') {
        newItem = {
            id: isEdit ? item.id : Date.now(),
            name: document.getElementById('faculty-name').value.trim(),
            employeeId: document.getElementById('faculty-id').value.trim(),
            department: document.getElementById('faculty-dept').value.trim(),
            email: document.getElementById('faculty-email').value.trim(),
            maxHours: parseInt(document.getElementById('faculty-hours').value),
            subjects: Array.from(document.getElementById('faculty-subjects').selectedOptions).map(opt => parseInt(opt.value)),
            divisions: Array.from(document.getElementById('faculty-divisions').selectedOptions).map(opt => parseInt(opt.value)),
            year: document.getElementById('faculty-year').value,
            availableTimeSlots: {},
            availableDays: []
        };
        
        // Collect selected time slots from the grid
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        daysOfWeek.forEach(day => {
            const dayCheckboxes = document.querySelectorAll(`.time-slot-checkbox[data-day="${day}"]:checked`);
            if (dayCheckboxes.length > 0) {
                const slots = Array.from(dayCheckboxes).map(cb => cb.getAttribute('data-slot'));
                newItem.availableTimeSlots[day] = slots;
                newItem.availableDays.push(day);
            }
        });
        
        // Validate that at least some slots are selected
        if (Object.keys(newItem.availableTimeSlots).length === 0) {
            showNotification('Please select at least one time slot for faculty availability!', 'error');
            return;
        }
        
        console.log('📅 Faculty availability:', newItem.availableTimeSlots);
        
        // Update or add to faculty array
        if (isEdit) {
            const index = faculty.findIndex(f => f.id === item.id);
            if (index !== -1) faculty[index] = newItem;
        } else {
            faculty.push(newItem);
        }
        
    } else if (type === 'rooms') {
        newItem = {
            id: isEdit ? item.id : Date.now(),
            number: document.getElementById('room-number').value.trim(),
            building: document.getElementById('room-building').value.trim(),
            capacity: parseInt(document.getElementById('room-capacity').value),
            type: document.getElementById('room-type').value,
            facilities: document.getElementById('room-facilities').value.split(',').map(f => f.trim()).filter(f => f)
        };
        
        // Update or add to rooms array
        if (isEdit) {
            const index = rooms.findIndex(r => r.id === item.id);
            if (index !== -1) rooms[index] = newItem;
        } else {
            rooms.push(newItem);
        }
        
    } else if (type === 'timeslots') {
        newItem = {
            id: isEdit ? item.id : Date.now(),
            day: document.getElementById('slot-day').value,
            startTime: document.getElementById('slot-start').value,
            endTime: document.getElementById('slot-end').value,
            description: document.getElementById('slot-description').value.trim()
        };
        
        // Update or add to timeslots array
        if (isEdit) {
            const index = timeslots.findIndex(t => t.id === item.id);
            if (index !== -1) timeslots[index] = newItem;
        } else {
            timeslots.push(newItem);
        }
    }

    // Save all data to localStorage
    console.log('💾 Saving to localStorage...');
    localStorage.setItem('timetables', JSON.stringify(timetables));
    localStorage.setItem('divisions', JSON.stringify(divisions));
    localStorage.setItem('subjects', JSON.stringify(subjects));
    localStorage.setItem('faculty', JSON.stringify(faculty));
    localStorage.setItem('rooms', JSON.stringify(rooms));
    localStorage.setItem('timeslots', JSON.stringify(timeslots));
    
    console.log(`✅ Saved ${type}:`, type === 'subjects' ? `${subjects.length} subjects` : newItem);

    closeModal();
    renderAllData();
    
    showNotification(`${isEdit ? 'Updated' : 'Added'} ${type.slice(0, -1)} successfully!`, 'success');
}

// ===== VIEW TIMETABLE DETAILS =====
function viewTimetable(id) {
    const timetable = timetables.find(t => t.id === id);
    if (!timetable) {
        showNotification('Timetable not found', 'error');
        return;
    }
    
    // Open modal to display timetable
    const modal = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const modalFormFields = document.getElementById('modal-form-fields');
    const submitBtn = document.getElementById('modal-submit-btn');
    
    modalTitle.textContent = timetable.name;
    modalDescription.textContent = `Created: ${new Date(timetable.createdAt).toLocaleDateString()} | Fitness: ${timetable.fitness}%`;
    submitBtn.style.display = 'none'; // Hide submit button
    
    modalFormFields.innerHTML = `
        <div style="max-height: 60vh; overflow-y: auto;">
            ${generateScheduleTable(timetable.schedule)}
        </div>
        <div style="margin-top: 1rem; display: flex; gap: 1rem;">
            <button type="button" class="btn btn-primary" onclick="downloadTimetable(${id})">
                <i class="fas fa-download"></i> Download CSV
            </button>
            <button type="button" class="btn btn-secondary" onclick="printTimetable(${id})">
                <i class="fas fa-print"></i> Print
            </button>
        </div>
    `;
    
    const form = document.getElementById('modal-form');
    form.onsubmit = (e) => {
        e.preventDefault();
        closeModal();
    };
    
    modal.classList.add('active');
}

// Helper function to generate day-wise time slot grid
function generateDayWiseTimeSlotGrid(availableTimeSlots) {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Check which days are currently selected
    const selectedDays = typeof availableTimeSlots === 'object' && !Array.isArray(availableTimeSlots)
        ? Object.keys(availableTimeSlots)
        : [];
    
    // Generate time slots from 8 AM to 6 PM (10 hours)
    const timeSlots = [];
    for (let hour = 8; hour < 18; hour++) {
        const startTime = `${String(hour).padStart(2, '0')}:00`;
        const endTime = `${String(hour + 1).padStart(2, '0')}:00`;
        timeSlots.push({
            value: startTime,
            label: `${formatTime(startTime)} - ${formatTime(endTime)}`
        });
    }
    
    let html = `
        <div style="background: rgba(255,255,255,0.05); padding: 1.5rem; border-radius: 0.75rem; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h4 style="margin: 0; color: #a855f7;"><i class="fas fa-calendar-check"></i> Faculty Availability Schedule</h4>
                <div style="display: flex; gap: 0.5rem;">
                    <button type="button" class="btn btn-secondary" onclick="selectStandardHours()" style="padding: 0.5rem 1rem;">
                        <i class="fas fa-clock"></i> Standard Hours (9AM-5PM)
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="selectAllSlots()" style="padding: 0.5rem 1rem;">
                        <i class="fas fa-check-double"></i> Select All
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="clearAllSlots()" style="padding: 0.5rem 1rem;">
                        <i class="fas fa-times"></i> Clear All
                    </button>
                </div>
            </div>
            
            <div style="background: rgba(168,85,247,0.1); padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem; border-left: 3px solid #a855f7;">
                <p style="margin: 0; font-size: 0.9rem; color: rgba(255,255,255,0.9);">
                    <i class="fas fa-info-circle"></i> 
                    <strong>Instructions:</strong> Select the time slots when this faculty member is available. Click on individual cells or use column/row headers to select multiple slots at once.
                </p>
            </div>
            
            <div style="overflow-x: auto; border-radius: 0.5rem; background: rgba(255,255,255,0.03);">
                <table style="width: 100%; border-collapse: collapse; min-width: 800px;">
                    <thead>
                        <tr style="background: rgba(168,85,247,0.3);">
                            <th style="padding: 1rem; text-align: left; border: 1px solid rgba(255,255,255,0.1); position: sticky; left: 0; background: rgba(168,85,247,0.3); z-index: 2;">
                                <input type="checkbox" id="select-all-time-slots" onchange="toggleAllTimeSlots()" style="margin-right: 0.5rem; width: 18px; height: 18px; cursor: pointer;">
                                <label for="select-all-time-slots" style="cursor: pointer; font-weight: 600;">Day / Time</label>
                            </th>
    `;
    
    // Add time slot headers
    timeSlots.forEach((slot, slotIndex) => {
        html += `
            <th style="padding: 0.75rem 0.5rem; text-align: center; border: 1px solid rgba(255,255,255,0.1); font-size: 0.85rem; white-space: nowrap;">
                <div style="margin-bottom: 0.3rem;">
                    <input type="checkbox" 
                           class="column-header-checkbox" 
                           data-slot="${slot.value}"
                           onchange="toggleColumn('${slot.value}')"
                           style="width: 16px; height: 16px; cursor: pointer;">
                </div>
                <div style="font-weight: 600;">${slot.label}</div>
            </th>
        `;
    });
    
    html += `
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    // Add rows for each day
    daysOfWeek.forEach((day, dayIndex) => {
        const daySlots = availableTimeSlots[day] || [];
        
        html += `
            <tr style="${dayIndex % 2 === 0 ? 'background: rgba(255,255,255,0.02);' : ''}">
                <td style="padding: 1rem; font-weight: 600; border: 1px solid rgba(255,255,255,0.1); position: sticky; left: 0; background: ${dayIndex % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.1)'}; z-index: 1;">
                    <input type="checkbox" 
                           class="row-header-checkbox" 
                           data-day="${day}"
                           onchange="toggleRow('${day}')"
                           style="margin-right: 0.5rem; width: 18px; height: 18px; cursor: pointer;">
                    <span>${day}</span>
                </td>
        `;
        
        // Add checkbox for each time slot
        timeSlots.forEach(slot => {
            const isChecked = daySlots.includes(slot.value);
            html += `
                <td style="padding: 0.5rem; text-align: center; border: 1px solid rgba(255,255,255,0.1);">
                    <label style="display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0.5rem;">
                        <input type="checkbox" 
                               class="time-slot-checkbox" 
                               data-day="${day}" 
                               data-slot="${slot.value}"
                               ${isChecked ? 'checked' : ''}
                               onchange="updateSlotSelection()"
                               style="width: 20px; height: 20px; cursor: pointer; margin: 0;">
                    </label>
                </td>
            `;
        });
        
        html += `
            </tr>
        `;
    });
    
    html += `
                    </tbody>
                </table>
            </div>
            
            <div style="margin-top: 1rem; padding: 1rem; background: rgba(168,85,247,0.1); border-radius: 0.5rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <div style="text-align: center;">
                    <div style="font-size: 2rem; color: #a855f7; font-weight: 700;" id="total-selected-slots">0</div>
                    <div style="font-size: 0.9rem; color: rgba(255,255,255,0.7);">Total Slots Selected</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 2rem; color: #10b981; font-weight: 700;" id="total-hours-available">0.0</div>
                    <div style="font-size: 0.9rem; color: rgba(255,255,255,0.7);">Hours Per Week</div>
                </div>
                <div style="text-align: center;">
                    <div style="font-size: 2rem; color: #f59e0b; font-weight: 700;" id="total-days-available">0</div>
                    <div style="font-size: 0.9rem; color: rgba(255,255,255,0.7);">Days Available</div>
                </div>
            </div>
            
            <div style="margin-top: 1rem; padding: 0.75rem 1rem; background: rgba(59, 130, 246, 0.1); border-radius: 0.5rem; border-left: 3px solid #3b82f6;">
                <p style="margin: 0; font-size: 0.85rem; color: rgba(255,255,255,0.8);">
                    <i class="fas fa-lightbulb" style="color: #fbbf24;"></i> 
                    <strong>Tip:</strong> Use row/column headers to quickly select entire days or time slots. The timetable generator will only schedule classes during selected slots.
                </p>
            </div>
        </div>
    `;
    
    // Trigger initial count update after a short delay to ensure DOM is ready
    setTimeout(() => {
        updateSlotSelection();
    }, 100);
    
    return html;
}

// Helper function to select standard hours (9 AM - 5 PM, Mon-Fri)
window.selectStandardHours = function() {
    const standardDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    // First, uncheck all
    document.querySelectorAll('.time-slot-checkbox').forEach(cb => {
        cb.checked = false;
    });
    
    // Then check standard hours (9 AM - 5 PM = 8 hours)
    standardDays.forEach(day => {
        for (let hour = 9; hour < 17; hour++) {
            const timeSlot = `${String(hour).padStart(2, '0')}:00`;
            const checkbox = document.querySelector(`.time-slot-checkbox[data-day="${day}"][data-slot="${timeSlot}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        }
    });
    
    updateSlotSelection();
    updateHeaderCheckboxes();
    showNotification('Standard hours selected: Monday-Friday, 9:00 AM - 5:00 PM (40 hours/week)', 'success');
};

// Helper function to select all slots
window.selectAllSlots = function() {
    document.querySelectorAll('.time-slot-checkbox').forEach(cb => {
        cb.checked = true;
    });
    updateSlotSelection();
    updateHeaderCheckboxes();
};

// Helper function to clear all slots
window.clearAllSlots = function() {
    document.querySelectorAll('.time-slot-checkbox').forEach(cb => {
        cb.checked = false;
    });
    updateSlotSelection();
    updateHeaderCheckboxes();
};

// Helper function to toggle all time slots
window.toggleAllTimeSlots = function() {
    const masterCheckbox = document.getElementById('select-all-time-slots');
    const isChecked = masterCheckbox.checked;
    
    document.querySelectorAll('.time-slot-checkbox').forEach(cb => {
        cb.checked = isChecked;
    });
    
    updateSlotSelection();
    updateHeaderCheckboxes();
};

// Helper function to toggle entire row (day)
window.toggleRow = function(day) {
    const rowCheckbox = document.querySelector(`.row-header-checkbox[data-day="${day}"]`);
    const isChecked = rowCheckbox.checked;
    
    document.querySelectorAll(`.time-slot-checkbox[data-day="${day}"]`).forEach(cb => {
        cb.checked = isChecked;
    });
    
    updateSlotSelection();
    updateHeaderCheckboxes();
};

// Helper function to toggle entire column (time slot)
window.toggleColumn = function(slot) {
    const colCheckbox = document.querySelector(`.column-header-checkbox[data-slot="${slot}"]`);
    const isChecked = colCheckbox.checked;
    
    document.querySelectorAll(`.time-slot-checkbox[data-slot="${slot}"]`).forEach(cb => {
        cb.checked = isChecked;
    });
    
    updateSlotSelection();
    updateHeaderCheckboxes();
};

// Update slot selection counts and header checkboxes
window.updateSlotSelection = function() {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let totalSlots = 0;
    let daysWithSlots = new Set();
    
    daysOfWeek.forEach(day => {
        const dayCheckboxes = document.querySelectorAll(`.time-slot-checkbox[data-day="${day}"]`);
        dayCheckboxes.forEach(cb => {
            if (cb.checked) {
                totalSlots++;
                daysWithSlots.add(day);
            }
        });
    });
    
    const totalHours = totalSlots; // Each slot is 1 hour
    const totalDays = daysWithSlots.size;
    
    // Update display
    const totalSlotsEl = document.getElementById('total-selected-slots');
    const totalHoursEl = document.getElementById('total-hours-available');
    const totalDaysEl = document.getElementById('total-days-available');
    
    if (totalSlotsEl) totalSlotsEl.textContent = totalSlots;
    if (totalHoursEl) totalHoursEl.textContent = totalHours.toFixed(1);
    if (totalDaysEl) totalDaysEl.textContent = totalDays;
    
    updateHeaderCheckboxes();
};

// Update header checkboxes based on current selection
function updateHeaderCheckboxes() {
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    // Update row header checkboxes
    daysOfWeek.forEach(day => {
        const rowCheckbox = document.querySelector(`.row-header-checkbox[data-day="${day}"]`);
        if (rowCheckbox) {
            const dayCheckboxes = document.querySelectorAll(`.time-slot-checkbox[data-day="${day}"]`);
            const checkedCount = Array.from(dayCheckboxes).filter(cb => cb.checked).length;
            rowCheckbox.checked = checkedCount > 0 && checkedCount === dayCheckboxes.length;
            rowCheckbox.indeterminate = checkedCount > 0 && checkedCount < dayCheckboxes.length;
        }
    });
    
    // Update column header checkboxes
    for (let hour = 8; hour < 18; hour++) {
        const timeSlot = `${String(hour).padStart(2, '0')}:00`;
        const colCheckbox = document.querySelector(`.column-header-checkbox[data-slot="${timeSlot}"]`);
        if (colCheckbox) {
            const slotCheckboxes = document.querySelectorAll(`.time-slot-checkbox[data-slot="${timeSlot}"]`);
            const checkedCount = Array.from(slotCheckboxes).filter(cb => cb.checked).length;
            colCheckbox.checked = checkedCount > 0 && checkedCount === slotCheckboxes.length;
            colCheckbox.indeterminate = checkedCount > 0 && checkedCount < slotCheckboxes.length;
        }
    }
    
    // Update master checkbox
    const masterCheckbox = document.getElementById('select-all-time-slots');
    if (masterCheckbox) {
        const allCheckboxes = document.querySelectorAll('.time-slot-checkbox');
        const checkedCount = Array.from(allCheckboxes).filter(cb => cb.checked).length;
        masterCheckbox.checked = checkedCount > 0 && checkedCount === allCheckboxes.length;
        masterCheckbox.indeterminate = checkedCount > 0 && checkedCount < allCheckboxes.length;
    }
}

// Make sure all functions are globally available
window.generateScheduleTable = generateScheduleTable;
window.editItem = editItem;
window.toggleForm = toggleForm;
window.saveModalForm = saveModalForm;
window.viewTimetable = viewTimetable;
window.downloadTimetable = downloadTimetable;
window.printTimetable = printTimetable;
window.closeModal = closeModal;
console.log('📊 Resource Tracker loaded');

// Resource tracking for timetable generation
class ResourceTracker {
    constructor() {
        this.facultySchedule = {};
        this.roomSchedule = {};
    }
    
    reset() {
        this.facultySchedule = {};
        this.roomSchedule = {};
    }
    
    isFacultyAvailable(facultyId, day, timeSlot) {
        const key = `${facultyId}-${day}-${timeSlot}`;
        return !this.facultySchedule[key];
    }
    
    isRoomAvailable(roomId, day, timeSlot) {
        const key = `${roomId}-${day}-${timeSlot}`;
        return !this.roomSchedule[key];
    }
    
    assignFaculty(facultyId, day, timeSlot, assignmentData) {
        const key = `${facultyId}-${day}-${timeSlot}`;
        this.facultySchedule[key] = assignmentData;
    }
    
    assignRoom(roomId, day, timeSlot, assignmentData) {
        const key = `${roomId}-${day}-${timeSlot}`;
        this.roomSchedule[key] = assignmentData;
    }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.ResourceTracker = ResourceTracker;
}

console.log('✅ Resource Tracker initialized');

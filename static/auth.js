console.log('🔐 Auth.js loading...');

// Global auth functions
window.switchToLogin = switchToLogin;
window.switchToSignup = switchToSignup;
window.handleLogin = handleLogin;
window.handleSignup = handleSignup;
window.checkAuth = checkAuth;

// Switch forms
function switchToLogin() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm && signupForm) {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        console.log('✅ Switched to login form');
    }
}

function switchToSignup() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm && signupForm) {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        console.log('✅ Switched to signup form');
    }
}

// Handle login
async function handleLogin(event) {
    event.preventDefault();
    console.log('🔐 Login attempt...');
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!username || !password) {
        alert('Please enter both username and password');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Login successful:', data.user);
            alert(`Welcome back, ${data.user.username}!`);
            
            // Redirect to dashboard
            window.location.href = '/dashboard.html';
        } else {
            console.error('❌ Login failed:', data.error);
            alert(`Login failed: ${data.error}`);
        }
    } catch (error) {
        console.error('❌ Login error:', error);
        alert(`Login error: ${error.message}\n\nMake sure the Flask server is running on port 5000!`);
    }
}

// Handle signup
async function handleSignup(event) {
    event.preventDefault();
    console.log('📝 Signup attempt...');
    
    const fullName = document.getElementById('signupFullName').value;
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    if (!username || !email || !password) {
        alert('Please fill in all required fields');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:5000/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ fullName, username, email, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Signup successful:', data.user);
            alert(`Account created successfully!\nWelcome, ${data.user.username}!`);
            
            // Redirect to dashboard
            window.location.href = '/dashboard.html';
        } else {
            console.error('❌ Signup failed:', data.error);
            alert(`Signup failed: ${data.error}`);
        }
    } catch (error) {
        console.error('❌ Signup error:', error);
        alert(`Signup error: ${error.message}\n\nMake sure the Flask server is running on port 5000!`);
    }
}

// Check auth status
async function checkAuth() {
    try {
        const response = await fetch('http://localhost:5000/api/auth/me', {
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success && data.user) {
            console.log('✅ User authenticated:', data.user.username);
            return data.user;
        } else {
            console.log('ℹ️ User not authenticated');
            return null;
        }
    } catch (error) {
        console.error('❌ Auth check error:', error);
        return null;
    }
}

console.log('✅ Auth.js loaded');

console.log('📋 Header.js loading...');

// Make functions globally available immediately
window.updateHeaderAuth = updateHeaderAuth;
window.handleAuthButtonClick = handleAuthButtonClick;
window.handleUserMenuClick = handleUserMenuClick;
window.handleHeaderLogout = handleHeaderLogout;

// Check auth status and update header button
async function updateHeaderAuth() {
	try {
		const response = await fetch('http://localhost:5000/api/auth/me', {
			credentials: 'include'
		});
		const data = await response.json();
		
		const authBtn = document.getElementById('headerAuthBtn');
		
		if (!authBtn) {
			console.warn('⚠️ Header auth button not found yet, will retry');
			setTimeout(updateHeaderAuth, 100);
			return;
		}
		
		if (data.success && data.user) {
			// User is logged in
			authBtn.innerHTML = `<i class="fas fa-user-circle"></i> <span id="headerAuthText">${data.user.username}</span>`;
			authBtn.onclick = handleUserMenuClick;
			console.log('✅ Header updated: User logged in as', data.user.username);
		} else {
			// User is not logged in
			authBtn.innerHTML = `<i class="fas fa-sign-in-alt"></i> <span id="headerAuthText">Login</span>`;
			authBtn.onclick = handleAuthButtonClick;
			console.log('✅ Header updated: User not logged in');
		}
	} catch (error) {
		console.error('❌ Auth check error:', error);
	}
}

function handleAuthButtonClick(e) {
	if (e) e.preventDefault();
	console.log('🔐 Login button clicked!');
	console.log('Redirecting to /auth.html...');
	window.location.href = '/auth.html?mode=login';
}

function handleUserMenuClick(e) {
	if (e) e.preventDefault();
	console.log('👤 User menu clicked');
	if (confirm('Do you want to logout?')) {
		handleHeaderLogout();
	}
}

async function handleHeaderLogout() {
	try {
		console.log('🚪 Logging out...');
		const response = await fetch('http://localhost:5000/api/auth/logout', {
			method: 'POST',
			credentials: 'include'
		});
		
		const data = await response.json();
		
		if (data.success) {
			console.log('✅ Logout successful');
			alert('Logged out successfully!');
			window.location.href = '/';
		}
	} catch (error) {
		console.error('❌ Logout error:', error);
		alert('Logout failed: ' + error.message);
	}
}

// Wait for header to be injected, then attach handlers
function waitForHeaderAndAttach() {
	const authBtn = document.getElementById('headerAuthBtn');
	if (authBtn) {
		console.log('✅ Found auth button, attaching click handler');
		authBtn.onclick = handleAuthButtonClick;
		updateHeaderAuth();
	} else {
		console.log('⏳ Waiting for header to load...');
		setTimeout(waitForHeaderAndAttach, 50);
	}
}

// Start waiting
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', waitForHeaderAndAttach);
} else {
	waitForHeaderAndAttach();
}

console.log('✅ Header.js loaded');

import { auth, db } from './firebase-modules.js'; // Keep firebase-modules for general db access if needed
import { onAuthStateChanged, signOut } from './auth.js'; // Import only necessary auth functions for header display

// --- Authentication UI and Logic ---
// These UI elements are now handled by auth.js for their display logic
// This file will only trigger auth state changes from the header if needed, but not define the core logic
const userDisplay = document.getElementById('user-display');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const mobileAuthContainer = document.querySelector('.mobile-auth-controls');

// Listen for auth state changes for UI display purposes in header
onAuthStateChanged(auth, async (user) => {
    if (mobileAuthContainer) mobileAuthContainer.innerHTML = ''; // Clear mobile auth controls

    if (user) {
        // User is signed in
        if (userDisplay) userDisplay.textContent = `환영합니다, ${user.email}`;
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';

        // Mobile auth
        if (mobileAuthContainer) {
            const mobileLogoutBtn = document.createElement('button');
            mobileLogoutBtn.textContent = '로그아웃';
            mobileLogoutBtn.style.cssText = 'padding: 10px 20px; width: 100%; background-color: var(--accent-color); color: white; border: none; border-radius: 5px; cursor: pointer;';
            mobileLogoutBtn.addEventListener('click', async () => {
                await signOut(auth);
                alert('로그아웃되었습니다.');
                const mobileNav = document.querySelector('.mobile-nav');
                if (mobileNav) mobileNav.style.right = '-100%'; // Close mobile nav
                window.location.href = 'index.html'; // Redirect to homepage after logout
            });
            mobileAuthContainer.appendChild(mobileLogoutBtn);
        }

    } else {
        // User is signed out
        if (userDisplay) userDisplay.textContent = '';
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';

        // Mobile auth
        if (mobileAuthContainer) {
            const mobileLoginBtn = document.createElement('button');
            mobileLoginBtn.textContent = '로그인 / 회원가입';
            mobileLoginBtn.style.cssText = 'padding: 10px 20px; width: 100%; background-color: var(--accent-color); color: white; border: none; border-radius: 5px; cursor: pointer;';
            mobileLoginBtn.addEventListener('click', () => {
                window.location.href = 'login_page.html'; // Redirect to login page
                const mobileNav = document.querySelector('.mobile-nav');
                if (mobileNav) mobileNav.style.right = '-100%';
            });
            mobileAuthContainer.appendChild(mobileLoginBtn);
        }
    }
});

import { auth, db } from './firebase-modules.js';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js';
import { collection, addDoc, getDoc, doc } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js';

// --- Global UI Elements (if available) ---
const userDisplay = document.getElementById('user-display');
const loginBtnHeader = document.getElementById('login-btn'); // Renamed to avoid conflict
const logoutBtnHeader = document.getElementById('logout-btn'); // Renamed to avoid conflict
const mobileAuthContainer = document.querySelector('.mobile-auth-controls');

// --- Authentication Logic ---

// Listen for auth state changes globally
onAuthStateChanged(auth, async (user) => {
    if (mobileAuthContainer) mobileAuthContainer.innerHTML = ''; // Clear mobile auth controls

    if (user) {
        // User is signed in
        if (userDisplay) userDisplay.textContent = `환영합니다, ${user.email}`;
        if (loginBtnHeader) loginBtnHeader.style.display = 'none';
        if (logoutBtnHeader) logoutBtnHeader.style.display = 'inline-block';

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
                // Redirect to homepage after logout
                window.location.href = 'index.html';
            });
            mobileAuthContainer.appendChild(mobileLogoutBtn);
        }

        // Fetch user's admin status from Firestore (only if needed on current page)
        // This part will remain page-specific if only board.js needs isAdmin
        // For general auth state, we don't need to fetch admin status here globally.

    } else {
        // User is signed out
        if (userDisplay) userDisplay.textContent = '';
        if (loginBtnHeader) loginBtnHeader.style.display = 'inline-block';
        if (logoutBtnHeader) logoutBtnHeader.style.display = 'none';

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


// --- Login Page Specific Logic (if on login_page.html) ---
if (window.location.pathname.endsWith('login_page.html')) {
    const loginEmailInput = document.getElementById('login-email');
    const loginPasswordInput = document.getElementById('login-password');
    const loginSubmitBtn = document.getElementById('login-submit-btn');

    if (loginSubmitBtn) {
        loginSubmitBtn.addEventListener('click', async () => {
            const email = loginEmailInput.value;
            const password = loginPasswordInput.value;
            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                if (!userCredential.user.emailVerified) {
                    await signOut(auth);
                    alert('이메일 인증이 필요합니다. 받은 편지함을 확인해주세요.');
                    return;
                }
                alert('로그인 성공!');
                window.location.href = 'index.html'; // Redirect to homepage after login
            } catch (error) {
                alert(`로그인 실패: ${error.message}`);
            }
        });
    }
}

// --- Register Page Specific Logic (if on register_page.html) ---
if (window.location.pathname.endsWith('register_page.html')) {
    const registerEmailInput = document.getElementById('register-email');
    const registerPasswordInput = document.getElementById('register-password');
    const privacyAgreeCheckbox = document.getElementById('privacy-agree');
    const registerSubmitBtn = document.getElementById('register-submit-btn');

    if (registerSubmitBtn) {
        registerSubmitBtn.addEventListener('click', async () => {
            const email = registerEmailInput.value;
            const password = registerPasswordInput.value;
            const privacyAgreed = privacyAgreeCheckbox.checked;

            if (!privacyAgreed) {
                alert('개인정보 수집 및 이용에 동의해야 회원가입을 할 수 있습니다.');
                return;
            }

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                await sendEmailVerification(userCredential.user); // Send verification email
                
                await addDoc(collection(db, 'users'), {
                    uid: userCredential.user.uid,
                    email: userCredential.user.email,
                    isAdmin: false // Default to not admin
                });
                alert('회원가입 성공! 이메일 인증 링크를 보냈으니 확인해주세요.');
                window.location.href = 'login_page.html'; // Redirect to login page after registration
            } catch (error) {
                alert(`회원가입 실패: ${error.message}`);
            }
        });
    }
}

// Export auth object for other modules if needed (e.g., board.js might need it)
export { auth, db, onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, collection, addDoc, getDoc, doc };
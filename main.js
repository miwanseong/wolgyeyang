import { auth, db } from './firebase-modules.js';
import { onAuthStateChanged, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js';
import { collection, addDoc, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js';



// --- Authentication UI and Logic ---
const userDisplay = document.getElementById('user-display');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const mobileAuthContainer = document.querySelector('.mobile-auth-controls');

const authModal = document.getElementById('auth-modal');
const closeButton = authModal.querySelector('.close-button');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
const privacyAgreeCheckbox = document.getElementById('privacy-agree');
const modalLoginBtn = document.getElementById('modal-login-btn');
const modalRegisterBtn = document.getElementById('modal-register-btn');

// Show auth modal
loginBtn.addEventListener('click', () => {
    authModal.style.display = 'flex'; // Use flex to center the modal content
});

// Hide auth modal
closeButton.addEventListener('click', () => {
    authModal.style.display = 'none';
});

// Register new user
modalRegisterBtn.addEventListener('click', async () => {
    const email = authEmail.value;
    const password = authPassword.value;
    const privacyAgreed = privacyAgreeCheckbox.checked;

    if (!privacyAgreed) {
        alert('개인정보 수집 및 이용에 동의해야 회원가입을 할 수 있습니다.');
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Optionally, save user info to Firestore, e.g., role
        await addDoc(collection(db, 'users'), {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            isAdmin: false // Default to not admin
        });
        alert('회원가입 성공! 로그인되었습니다.');
        authModal.style.display = 'none';
    } catch (error) {
        alert(`회원가입 실패: ${error.message}`);
    }
});

// Login user
modalLoginBtn.addEventListener('click', async () => {
    const email = authEmail.value;
    const password = authPassword.value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        alert('로그인 성공!');
        authModal.style.display = 'none';
    } catch (error) {
        alert(`로그인 실패: ${error.message}`);
    }
});

// Logout user
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        alert('로그아웃되었습니다.');
    } catch (error) {
        alert(`로그아웃 실패: ${error.message}`);
    }
});

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
    mobileAuthContainer.innerHTML = ''; // Clear mobile auth controls

    if (user) {
        // User is signed in
        userDisplay.textContent = `환영합니다, ${user.email}`;
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';



        // Mobile auth
        const mobileLogoutBtn = document.createElement('button');
        mobileLogoutBtn.textContent = '로그아웃';
        mobileLogoutBtn.style.cssText = 'padding: 10px 20px; width: 100%; background-color: var(--accent-color); color: white; border: none; border-radius: 5px; cursor: pointer;';
        mobileLogoutBtn.addEventListener('click', async () => {
            await signOut(auth);
            alert('로그아웃되었습니다.');
            mobileNav.style.right = '-100%'; // Close mobile nav
        });
        mobileAuthContainer.appendChild(mobileLogoutBtn);



    } else {
        // User is signed out
        userDisplay.textContent = '';
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        authModal.style.display = 'none'; // Hide modal if user logs out
        // postFormContainer.style.display = 'none'; // Removed, now in board.js
        // newPostBtn.style.display = 'inline-block'; // Removed, now in board.js


        // Mobile auth
        const mobileLoginBtn = document.createElement('button');
        mobileLoginBtn.textContent = '로그인 / 회원가입';
        mobileLoginBtn.style.cssText = 'padding: 10px 20px; width: 100%; background-color: var(--accent-color); color: white; border: none; border-radius: 5px; cursor: pointer;';
        mobileLoginBtn.addEventListener('click', () => {
            authModal.style.display = 'flex';
            mobileNav.style.right = '-100%'; // Close mobile nav
        });
        mobileAuthContainer.appendChild(mobileLoginBtn);
    }
});

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js';
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, deleteDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js'; // Added firestore imports
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export auth and db for use in other modules
export { auth, db };

let isAdmin = false; // Global flag for admin status

// --- Authentication UI and Logic ---
const userDisplay = document.getElementById('user-display');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const mobileAuthContainer = document.querySelector('.mobile-auth-controls');

const authModal = document.getElementById('auth-modal');
const closeButton = authModal.querySelector('.close-button');
const authEmail = document.getElementById('auth-email');
const authPassword = document.getElementById('auth-password');
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
        postFormContainer.style.display = 'block'; // Show post form for logged-in users
        newPostBtn.style.display = 'none'; // Hide "새 글 작성" button if form is already shown

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

        // Fetch user's admin status from Firestore
        const userDocRef = doc(db, 'users', user.uid); // Assuming user document ID is their UID
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            isAdmin = userDocSnap.data().isAdmin || false;
            console.log("User admin status:", isAdmin);
        } else {
            // If user document doesn't exist, create it (e.g., if they registered before this feature)
            await addDoc(collection(db, 'users'), {
                uid: user.uid,
                email: user.email,
                isAdmin: false // Default to not admin
            });
            isAdmin = false;
        }

    } else {
        // User is signed out
        userDisplay.textContent = '';
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        authModal.style.display = 'none'; // Hide modal if user logs out
        postFormContainer.style.display = 'none'; // Hide post form for logged-out users
        newPostBtn.style.display = 'inline-block'; // Show "새 글 작성" button
        isAdmin = false; // Reset admin status on logout

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

// Function to delete a post
async function deletePost(postId) {
    if (confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
        try {
            await deleteDoc(doc(db, 'posts', postId));
            alert('게시글이 삭제되었습니다.');
        } catch (error) {
            alert(`게시글 삭제 실패: ${error.message}`);
        }
    }
}

// --- Bulletin Board UI and Logic ---
const postFormContainer = document.querySelector('.post-form-container');
const postTitleInput = document.getElementById('post-title');
const postContentInput = document.getElementById('post-content');
const submitPostBtn = document.getElementById('submit-post-btn');
const newPostBtn = document.getElementById('new-post-btn');
const postsContainer = document.querySelector('.posts-container');

// Toggle post form visibility
newPostBtn.addEventListener('click', () => {
    if (auth.currentUser) {
        postFormContainer.style.display = postFormContainer.style.display === 'none' ? 'block' : 'none';
        newPostBtn.textContent = postFormContainer.style.display === 'none' ? '새 글 작성' : '폼 닫기';
    } else {
        alert('로그인 후 글을 작성할 수 있습니다.');
        authModal.style.display = 'flex';
    }
});

// Submit new post
submitPostBtn.addEventListener('click', async () => {
    const title = postTitleInput.value;
    const content = postContentInput.value;
    const authorEmail = auth.currentUser ? auth.currentUser.email : 'Anonymous';

    if (title.trim() === '' || content.trim() === '') {
        alert('제목과 내용을 입력해주세요.');
        return;
    }

    try {
        await addDoc(collection(db, 'posts'), {
            title,
            content,
            author: authorEmail,
            timestamp: serverTimestamp()
        });
        postTitleInput.value = '';
        postContentInput.value = '';
        postFormContainer.style.display = 'none';
        newPostBtn.textContent = '새 글 작성';
        alert('게시글이 성공적으로 작성되었습니다.');
    } catch (error) {
        alert(`게시글 작성 실패: ${error.message}`);
    }
});

// Listen for posts in real-time
const postsCol = collection(db, 'posts');
const q = query(postsCol, orderBy('timestamp', 'desc'));

onSnapshot(q, (snapshot) => {
    postsContainer.innerHTML = ''; // Clear existing posts
    snapshot.forEach(doc => {
        const post = doc.data();
        const postId = doc.id;
        const postElement = document.createElement('div');
        postElement.classList.add('post-card');
        postElement.style.cssText = `
            background-color: var(--card-bg-color);
            padding: 1.5rem;
            border-radius: 10px;
            box-shadow: 0 5px 10px rgba(0,0,0,0.2);
            color: var(--text-color);
            position: relative; /* For delete button positioning */
        `;
        postElement.innerHTML = `
            <h3 style="color: var(--accent-color); margin-bottom: 0.5rem;">${post.title}</h3>
            <p style="margin-bottom: 1rem;">${post.content}</p>
            <small style="color: #bbb;">작성자: ${post.author} / ${post.timestamp ? new Date(post.timestamp.toDate()).toLocaleString() : '날짜 없음'}</small>
        `;

        if (isAdmin) { // Only show delete button if user is admin
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '삭제';
            deleteButton.style.cssText = `
                position: absolute;
                top: 10px;
                right: 10px;
                background-color: #dc3545;
                color: white;
                border: none;
                border-radius: 5px;
                padding: 5px 10px;
                cursor: pointer;
            `;
            deleteButton.addEventListener('click', () => deletePost(postId));
            postElement.appendChild(deleteButton);
        }
        postsContainer.appendChild(postElement);
    });
});


class VtuberCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        const name = this.getAttribute('name');
        const description = this.getAttribute('description');
        const imageUrl = this.getAttribute('image-url');

        this.shadowRoot.innerHTML = `
            <style>
                .vtuber-card {
                    background-color: var(--card-bg-color, #0f3460);
                    border-radius: 15px;
                    padding: 1.5rem;
                    text-align: center;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.2);
                    transition: transform 0.3s ease, opacity 0.6s ease-out, transform 0.6s ease-out;
                    width: 250px;
                    opacity: 0;
                    transform: translateY(20px);
                }
                .vtuber-card.show {
                    opacity: 1;
                    transform: translateY(0);
                }
                .vtuber-card:hover {
                    transform: translateY(-10px);
                }
                .vtuber-card img {
                    width: 100%;
                    border-radius: 10px;
                    margin-bottom: 1rem;
                }
                .vtuber-card h3 {
                    font-size: 1.5rem;
                    color: var(--accent-color, #e94560);
                    margin-bottom: 0.5rem;
                }
                .vtuber-card p {
                    font-size: 1rem;
                    color: var(--text-color, #f0f0f0);
                }
            </style>
            <div class="vtuber-card">
                <img src="${imageUrl}" alt="${name}">
                <h3>${name}</h3>
                <p>${description}</p>
            </div>
        `;
    }
}

customElements.define('vtuber-card', VtuberCard);

const vtubers = [
    {
        name: '루나',
        description: '노래를 사랑하는 달의 아이돌',
        imageUrl: 'https://source.unsplash.com/random/300x400/?anime,girl,moon'
    },
    {
        name: '렉스',
        description: '게임을 좋아하는 활기찬 공룡',
        imageUrl: 'https://source.unsplash.com/random/300x400/?anime,boy,dinosaur'
    },
    {
        name: '세라피나',
        description: '신비로운 마법을 사용하는 책의 요정',
        imageUrl: 'https://source.unsplash.com/random/300x400/?anime,girl,magic'
    }
];

const vtuberContainer = document.querySelector('.vtuber-cards');

vtubers.forEach(vtuber => {
    const card = document.createElement('vtuber-card');
    card.setAttribute('name', vtuber.name);
    card.setAttribute('description', vtuber.description);
    card.setAttribute('image-url', vtuber.imageUrl);
    vtuberContainer.appendChild(card);
});

// Hamburger menu toggle
const burger = document.querySelector('.burger');
const mobileNav = document.querySelector('.mobile-nav');

burger.addEventListener('click', () => {
    mobileNav.style.right = mobileNav.style.right === '0%' ? '-100%' : '0%';
});

// Scroll animation
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
            if(entry.target.shadowRoot){
                entry.target.shadowRoot.querySelector('.vtuber-card').classList.add('show');
            }
        }
    });
});

const hiddenElements = document.querySelectorAll('.card, .hero-content, vtuber-card');
hiddenElements.forEach((el) => observer.observe(el));

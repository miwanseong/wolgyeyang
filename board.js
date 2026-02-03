import { auth, db } from './firebase-modules.js';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, deleteDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js';
import { onAuthStateChanged, signOut } from './auth.js'; // Import only necessary auth functions for header display

let isAdmin = false; // Global flag for admin status

// --- Authentication UI and Logic for Board Page ---
// These UI elements are now handled by auth.js for their display logic
// This file will only trigger auth state changes from the header if needed, but not define the core logic
const userDisplay = document.getElementById('user-display');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const mobileAuthContainer = document.querySelector('.mobile-auth-controls');

// Listen for auth state changes globally
onAuthStateChanged(auth, async (user) => {
    if (mobileAuthContainer) mobileAuthContainer.innerHTML = ''; // Clear mobile auth controls

    if (user) {
        // User is signed in
        if (userDisplay) userDisplay.textContent = `환영합니다, ${user.email}`;
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
        if (postFormContainer) postFormContainer.style.display = 'none'; // Initially hide the form
        if (newPostBtn) newPostBtn.style.display = 'inline-block'; // Show the 'New Post' button


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
                window.location.href = 'index.html';
            });
            mobileAuthContainer.appendChild(mobileLogoutBtn);
        }

        // Fetch user's admin status from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            isAdmin = userDocSnap.data().isAdmin || false;

        } else {
            await addDoc(collection(db, 'users'), {
                uid: user.uid,
                email: user.email,
                isAdmin: false
            });
            isAdmin = false;
        }

    } else {
        // User is signed out
        if (userDisplay) userDisplay.textContent = '';
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (postFormContainer) postFormContainer.style.display = 'none';
        if (newPostBtn) newPostBtn.style.display = 'inline-block';
        isAdmin = false;

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
if (newPostBtn) {
    newPostBtn.addEventListener('click', () => {
        if (auth.currentUser) {
            postFormContainer.style.display = postFormContainer.style.display === 'none' ? 'block' : 'none';
            newPostBtn.textContent = postFormContainer.style.display === 'none' ? '새 글 작성' : '폼 닫기';
        } else {
            alert('로그인 후 글을 작성할 수 있습니다.');
            if (authModal) authModal.style.display = 'flex';
        }
    });
}


// Submit new post
if (submitPostBtn) {
    submitPostBtn.addEventListener('click', async () => {
        const title = postTitleInput.value;
        const content = postContentInput.value;
        const user = auth.currentUser;

        if (!user) {
            alert('로그인 후 게시글을 작성할 수 있습니다.');
            return;
        }

        if (title.trim() === '' || content.trim() === '') {
            alert('제목과 내용을 입력해주세요.');
            return;
        }

        try {
            await addDoc(collection(db, 'posts'), {
                title,
                content,
                author: user.email,
                authorId: user.uid, // Add author's UID
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
}


// Listen for posts in real-time
const postsCol = collection(db, 'posts');
const q = query(postsCol, orderBy('timestamp', 'desc'));

onSnapshot(q, (snapshot) => {
    if (postsContainer) postsContainer.innerHTML = ''; // Clear existing posts
    const currentUser = auth.currentUser;
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

        // Show delete button if user is admin or the author of the post
        if (isAdmin || (currentUser && currentUser.uid === post.authorId)) {
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
        if (postsContainer) postsContainer.appendChild(postElement);
    });
});

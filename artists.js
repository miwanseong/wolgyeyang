import { auth, db } from './firebase-modules.js';
import { onAuthStateChanged } from './auth.js';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js';

const artistsGrid = document.querySelector('.artists-grid');
const addArtistBtn = document.getElementById('add-artist-btn');
const addArtistFormContainer = document.querySelector('.add-artist-form-container');
const artistNameInput = document.getElementById('artist-name');
const artistImageInput = document.getElementById('artist-image');
const artistDescriptionInput = document.getElementById('artist-description');
const submitArtistBtn = document.getElementById('submit-artist-btn');

let isAdmin = false; // Flag to determine if the current user is an admin

// Function to fetch and display artists
async function fetchAndDisplayArtists() {
    artistsGrid.innerHTML = ''; // Clear existing artists
    const artistsCol = collection(db, 'artists');
    const q = query(artistsCol, orderBy('name', 'asc')); // Order artists by name
    const artistSnapshot = await getDocs(q);

    artistSnapshot.forEach(artistDoc => {
        const artist = artistDoc.data();
        const artistId = artistDoc.id;
        const artistCard = document.createElement('div');
        artistCard.classList.add('artist-card');
        artistCard.innerHTML = `
            <img src="${artist.image}" alt="${artist.name}" onerror="this.onerror=null;this.src='https://via.placeholder.com/150';">
            <h3>${artist.name}</h3>
            <p>${artist.description}</p>
        `;

        if (isAdmin) {
            const adminControls = document.createElement('div');
            adminControls.classList.add('admin-controls');
            const editButton = document.createElement('button');
            editButton.textContent = '수정';
            editButton.addEventListener('click', () => editArtist(artistId, artist));
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '삭제';
            deleteButton.classList.add('delete');
            deleteButton.addEventListener('click', () => deleteArtist(artistId));
            adminControls.appendChild(editButton);
            adminControls.appendChild(deleteButton);
            artistCard.appendChild(adminControls);
        }
        artistsGrid.appendChild(artistCard);
    });
}

// Function to add a new artist
async function addArtist() {
    const name = artistNameInput.value.trim();
    const image = artistImageInput.value.trim();
    const description = artistDescriptionInput.value.trim();

    if (name === '' || image === '' || description === '') {
        alert('모든 필드를 채워주세요.');
        return;
    }

    try {
        await addDoc(collection(db, 'artists'), {
            name,
            image,
            description,
            createdAt: new Date()
        });
        alert('아티스트가 성공적으로 추가되었습니다.');
        artistNameInput.value = '';
        artistImageInput.value = '';
        artistDescriptionInput.value = '';
        addArtistFormContainer.style.display = 'none';
        addArtistBtn.textContent = '아티스트 추가';
        fetchAndDisplayArtists(); // Refresh the list
    } catch (error) {
        alert(`아티스트 추가 실패: ${error.message}`);
    }
}

// Function to edit an artist
async function editArtist(artistId, currentArtist) {
    const newName = prompt('새 아티스트 이름을 입력하세요:', currentArtist.name);
    if (newName === null) return; // User cancelled

    const newImage = prompt('새 이미지 URL을 입력하세요:', currentArtist.image);
    if (newImage === null) return;

    const newDescription = prompt('새 설명을 입력하세요:', currentArtist.description);
    if (newDescription === null) return;

    if (newName.trim() === '' || newImage.trim() === '' || newDescription.trim() === '') {
        alert('모든 필드를 채워주세요.');
        return;
    }

    try {
        const artistRef = doc(db, 'artists', artistId);
        await updateDoc(artistRef, {
            name: newName,
            image: newImage,
            description: newDescription
        });
        alert('아티스트 정보가 성공적으로 업데이트되었습니다.');
        fetchAndDisplayArtists(); // Refresh the list
    } catch (error) {
        alert(`아티스트 정보 업데이트 실패: ${error.message}`);
    }
}

// Function to delete an artist
async function deleteArtist(artistId) {
    if (confirm('정말로 이 아티스트를 삭제하시겠습니까?')) {
        try {
            await deleteDoc(doc(db, 'artists', artistId));
            alert('아티스트가 삭제되었습니다.');
            fetchAndDisplayArtists(); // Refresh the list
        } catch (error) {
            alert(`아티스트 삭제 실패: ${error.message}`);
        }
    }
}

// Event Listeners
if (addArtistBtn) {
    addArtistBtn.addEventListener('click', () => {
        if (!auth.currentUser) {
            alert('로그인 후 아티스트를 추가할 수 있습니다.');
            window.location.href = 'login_page.html';
            return;
        }
        addArtistFormContainer.style.display = addArtistFormContainer.style.display === 'none' ? 'block' : 'none';
        addArtistBtn.textContent = addArtistFormContainer.style.display === 'none' ? '아티스트 추가' : '폼 닫기';
    });
}

if (submitArtistBtn) {
    submitArtistBtn.addEventListener('click', addArtist);
}

// Initial load and auth state check
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Check admin status
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            isAdmin = userDocSnap.data().isAdmin || false;
        }
        if (isAdmin) {
            if (addArtistBtn) addArtistBtn.style.display = 'inline-block';
        } else {
            if (addArtistBtn) addArtistBtn.style.display = 'none';
            if (addArtistFormContainer) addArtistFormContainer.style.display = 'none';
        }
    } else {
        isAdmin = false;
        if (addArtistBtn) addArtistBtn.style.display = 'none';
        if (addArtistFormContainer) addArtistFormContainer.style.display = 'none';
    }
    fetchAndDisplayArtists(); // Fetch and display artists after determining admin status
});

// Initial fetch (also called inside onAuthStateChanged)
// fetchAndDisplayArtists();

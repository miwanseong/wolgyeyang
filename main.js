import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js';
import { firebaseConfig } from './firebase-config.js';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export auth and db for use in other modules
export { auth, db };

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

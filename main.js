class CharacterCard extends HTMLElement {
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
                .character-card {
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
                .character-card.show {
                    opacity: 1;
                    transform: translateY(0);
                }
                .character-card:hover {
                    transform: translateY(-10px);
                }
                .character-card img {
                    width: 100%;
                    border-radius: 10px;
                    margin-bottom: 1rem;
                }
                .character-card h3 {
                    font-size: 1.5rem;
                    color: var(--accent-color, #e94560);
                    margin-bottom: 0.5rem;
                }
                .character-card p {
                    font-size: 1rem;
                    color: var(--text-color, #f0f0f0);
                }
            </style>
            <div class="character-card">
                <img src="${imageUrl}" alt="${name}">
                <h3>${name}</h3>
                <p>${description}</p>
            </div>
        `;
    }
}

customElements.define('character-card', CharacterCard);

const characters = [
    {
        name: '아리엘',
        description: '숲의 수호자, 자연의 힘을 다룹니다.',
        imageUrl: 'https://source.unsplash.com/random/300x400/?elf,fantasy'
    },
    {
        name: '카이저',
        description: '강력한 검술을 사용하는 제국의 기사단장.',
        imageUrl: 'https://source.unsplash.com/random/300x400/?knight,armor'
    },
    {
        name: '리리스',
        description: '어둠의 마법사, 금지된 힘을 탐구합니다.',
        imageUrl: 'https://source.unsplash.com/random/300x400/?sorceress,dark'
    }
];

const characterContainer = document.querySelector('.character-cards');

characters.forEach(char => {
    const card = document.createElement('character-card');
    card.setAttribute('name', char.name);
    card.setAttribute('description', char.description);
    card.setAttribute('image-url', char.imageUrl);
    characterContainer.appendChild(card);
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
                entry.target.shadowRoot.querySelector('.character-card').classList.add('show');
            }
        }
    });
});

const hiddenElements = document.querySelectorAll('.card, .hero-content, character-card');
hiddenElements.forEach((el) => observer.observe(el));

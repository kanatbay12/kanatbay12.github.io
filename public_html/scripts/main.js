import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { firebaseConfig, adminUid } from '/config.js';

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Элементы UI
const allUI = {
    menuToggleBtn: document.getElementById('menu-toggle-btn'),
    sideNav: document.getElementById('side-nav'),
    authModal: document.getElementById('auth-modal'),
    authModalCloseBtn: document.getElementById('auth-modal-close'),
    profileLoginBtn: document.getElementById('profile-login-btn'),
    profileArea: document.getElementById('profile-area'),
    profileButton: document.getElementById('profile-button'),
    profileAvatar: document.getElementById('profile-avatar'),
    profileEmail: document.getElementById('profile-email'),
    profileDropdown: document.getElementById('profile-dropdown'),
    logoutBtn: document.getElementById('logout-btn'),
    adminPanelLink: document.getElementById('admin-panel-link'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    switchToRegisterBtn: document.getElementById('switch-to-register'),
    switchToLoginBtn: document.getElementById('switch-to-login'),
    loginError: document.getElementById('login-error'),
    registerError: document.getElementById('register-error'),
    searchInput: document.getElementById('search-input'),
    brandsGrid: document.getElementById('brands-grid'),
    filterToggleBtn: document.getElementById('filter-toggle-btn'),
    filterDropdown: document.getElementById('filter-dropdown'),
    sortOptions: document.getElementById('sort-options'),
    continentOptions: document.getElementById('continent-options'),
    countrySelect: document.getElementById('country-select'),
    loader: document.getElementById('loader'),
    logoLink: document.getElementById('logo-link'),
};

let masterBrandList = [];

// --- Логика меню ---
if (allUI.menuToggleBtn && allUI.sideNav) {
    allUI.menuToggleBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });
    document.addEventListener('click', (e) => { if (!allUI.sideNav.contains(e.target) && !allUI.menuToggleBtn.contains(e.target) && allUI.sideNav.classList.contains('is-open')) { toggleMenu(); } });
    function toggleMenu() { allUI.menuToggleBtn.classList.toggle('is-active'); allUI.sideNav.classList.toggle('is-open'); }
}

// --- Логика модального окна авторизации ---
const openModal = (modal) => modal.classList.add('is-visible');
const closeModal = (modal) => modal.classList.remove('is-visible');
allUI.profileLoginBtn.addEventListener('click', () => { openModal(allUI.authModal); allUI.loginForm.classList.add('active'); allUI.registerForm.classList.remove('active'); });
allUI.authModalCloseBtn.addEventListener('click', () => closeModal(allUI.authModal));
allUI.authModal.addEventListener('click', (e) => { if (e.target === allUI.authModal) closeModal(allUI.authModal); });
allUI.switchToRegisterBtn.addEventListener('click', () => { allUI.loginForm.classList.remove('active'); allUI.registerForm.classList.add('active'); });
allUI.switchToLoginBtn.addEventListener('click', () => { allUI.registerForm.classList.remove('active'); allUI.loginForm.classList.add('active'); });

// --- Логика выпадающего меню профиля ---
allUI.profileButton.addEventListener('click', (e) => { e.stopPropagation(); allUI.profileDropdown.classList.toggle('is-open'); });
document.addEventListener('click', () => { if(allUI.profileDropdown.classList.contains('is-open')) allUI.profileDropdown.classList.remove('is-open'); });

// --- Логика Firebase Auth ---
allUI.registerForm.addEventListener('submit', (e) => { e.preventDefault(); const email = allUI.registerForm.querySelector('input[type="email"]').value; const password = allUI.registerForm.querySelector('input[type="password"]').value; allUI.registerError.style.display = 'none'; createUserWithEmailAndPassword(auth, email, password).then(() => closeModal(allUI.authModal)).catch((error) => { allUI.registerError.textContent = getAuthErrorMessage(error.code); allUI.registerError.style.display = 'block'; }); });
allUI.loginForm.addEventListener('submit', (e) => { e.preventDefault(); const email = allUI.loginForm.querySelector('input[type="email"]').value; const password = allUI.loginForm.querySelector('input[type="password"]').value; allUI.loginError.style.display = 'none'; signInWithEmailAndPassword(auth, email, password).then(() => closeModal(allUI.authModal)).catch((error) => { allUI.loginError.textContent = getAuthErrorMessage(error.code); allUI.loginError.style.display = 'block'; }); });
allUI.logoutBtn.addEventListener('click', () => { signOut(auth).catch((error) => console.error('Ошибка выхода:', error)); });

onAuthStateChanged(auth, (user) => {
    if (user) {
        allUI.profileLoginBtn.style.display = 'none';
        allUI.profileArea.style.display = 'block';
        allUI.profileEmail.textContent = user.email;
        allUI.profileAvatar.textContent = user.email.charAt(0).toUpperCase();
        allUI.adminPanelLink.style.display = user.uid === adminUid ? 'flex' : 'none';
    } else {
        allUI.profileLoginBtn.style.display = 'block';
        allUI.profileArea.style.display = 'none';
    }
});

function getAuthErrorMessage(errorCode) { switch (errorCode) { case 'auth/invalid-email': return 'Неверный формат email адреса.'; case 'auth/user-not-found': case 'auth/wrong-password': case 'auth/invalid-credential': return 'Неверный email или пароль.'; case 'auth/email-already-in-use': return 'Этот email уже зарегистрирован.'; case 'auth/weak-password': return 'Пароль слишком слабый (минимум 6 символов).'; default: return 'Произошла неизвестная ошибка. Попробуйте снова.'; } }

// --- Логика Firestore, Поиска, Фильтрации и Сортировки ---
function renderBrands(brandsToRender) {
    allUI.brandsGrid.innerHTML = '';
    if (brandsToRender.length === 0 && masterBrandList.length > 0) {
        allUI.brandsGrid.innerHTML = `<p>Марки не найдены.</p>`;
        return;
    }
    brandsToRender.forEach(brand => {
        const card = document.createElement('a');
        card.href = '#';
        card.className = 'brand-card';
        card.dataset.country = brand.country;
        card.dataset.continent = brand.continent;
        card.dataset.name = brand.name;
        card.innerHTML = `<span>${brand.name}</span>`;
        allUI.brandsGrid.appendChild(card);
    });
}

function applyFiltersAndSorting() {
    const searchTerm = allUI.searchInput.value.toLowerCase();
    const sortValue = allUI.sortOptions.querySelector('input[name="sort"]:checked').value;
    const continentValue = allUI.continentOptions.querySelector('input[name="continent"]:checked').value;
    const countryValue = allUI.countrySelect.value;
    
    const filteredBrands = masterBrandList.filter(brand => {
        const searchMatch = brand.name.toLowerCase().includes(searchTerm);
        const continentMatch = (continentValue === 'all' || brand.continent === continentValue);
        const countryMatch = (countryValue === 'all' || brand.country === countryValue);
        return searchMatch && continentMatch && countryMatch;
    });

    filteredBrands.sort((a, b) => sortValue === 'az' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
    renderBrands(filteredBrands);
}

// --- Инициализация страницы ---
document.addEventListener('DOMContentLoaded', () => {
    const countries = { 'de': 'Германия', 'jp': 'Япония', 'us': 'США', 'kr': 'Корея', 'se': 'Швеция', 'ru': 'Россия', 'gb': 'Англия', 'fr': 'Франция', 'it': 'Италия', 'cz': 'Чехия' };
    Object.entries(countries).forEach(([code, name]) => {
        const option = document.createElement('option');
        option.value = code;
        option.textContent = name;
        allUI.countrySelect.appendChild(option);
    });
    
    const brandsCollection = collection(db, "brands");
    onSnapshot(brandsCollection, (querySnapshot) => {
        masterBrandList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        allUI.loader.style.display = 'none';
        applyFiltersAndSorting();
    });

    allUI.filterToggleBtn.addEventListener('click', (e) => { e.stopPropagation(); allUI.filterDropdown.classList.toggle('is-open'); allUI.filterToggleBtn.classList.toggle('is-open'); });
    document.addEventListener('click', () => { if (allUI.filterDropdown.classList.contains('is-open')) { allUI.filterDropdown.classList.remove('is-open'); allUI.filterToggleBtn.classList.remove('is-open'); } });
    allUI.filterDropdown.addEventListener('click', e => e.stopPropagation());
    allUI.searchInput.addEventListener('input', applyFiltersAndSorting);
    allUI.sortOptions.addEventListener('change', applyFiltersAndSorting);
    allUI.continentOptions.addEventListener('change', () => { allUI.countrySelect.value = 'all'; applyFiltersAndSorting(); });
    allUI.countrySelect.addEventListener('change', (e) => {
        const selectedCountry = e.target.value;
        if (selectedCountry !== 'all') {
            const selectedContinent = masterBrandList.find(b => b.country === selectedCountry)?.continent;
            if(selectedContinent) { document.querySelector(`input[name="continent"][value="${selectedContinent}"]`).checked = true; }
        }
        applyFiltersAndSorting();
    });
    allUI.logoLink.addEventListener('click', () => {
        allUI.searchInput.value = '';
        allUI.sortOptions.querySelector('input[value="az"]').checked = true;
        allUI.continentOptions.querySelector('input[value="all"]').checked = true;
        allUI.countrySelect.value = 'all';
        applyFiltersAndSorting();
    });
});

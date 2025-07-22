// Import the functions you need from the SDKs you need
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { 
            getAuth, 
            createUserWithEmailAndPassword, 
            signInWithEmailAndPassword, 
            onAuthStateChanged,
            signOut
        } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
        import { 
            getFirestore, 
            collection, 
            addDoc,
            onSnapshot,
            doc,
            updateDoc,
            deleteDoc,
            query,
            limit,
            getDocs
        } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";



        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        // --- Элементы UI ---
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
            adminPanelBtn: document.getElementById('admin-panel-btn'),
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
            // Admin Panel
            adminPanelModal: document.getElementById('admin-panel-modal'),
            adminModalCloseBtn: document.getElementById('admin-modal-close'),
            adminBrandForm: document.getElementById('admin-brand-form'),
            adminFormTitle: document.getElementById('admin-form-title'),
            adminBrandId: document.getElementById('admin-brand-id'),
            adminBrandName: document.getElementById('admin-brand-name'),
            adminBrandContinent: document.getElementById('admin-brand-continent'),
            adminBrandCountry: document.getElementById('admin-brand-country'),
            adminFormSubmitBtn: document.getElementById('admin-form-submit-btn'),
            adminFormCancelBtn: document.getElementById('admin-form-cancel-btn'),
            adminBrandsList: document.getElementById('admin-brands-list'),
        };

        let masterBrandList = [];

        // --- Логика меню ---
        if (allUI.menuToggleBtn && allUI.sideNav) {
            allUI.menuToggleBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });
            document.addEventListener('click', (e) => { if (!allUI.sideNav.contains(e.target) && !allUI.menuToggleBtn.contains(e.target) && allUI.sideNav.classList.contains('is-open')) { toggleMenu(); } });
            function toggleMenu() { allUI.menuToggleBtn.classList.toggle('is-active'); allUI.sideNav.classList.toggle('is-open'); }
        }

        // --- Логика модальных окон ---
        const openModal = (modal) => modal.classList.add('is-visible');
        const closeModal = (modal) => modal.classList.remove('is-visible');

        allUI.profileLoginBtn.addEventListener('click', () => { openModal(allUI.authModal); allUI.loginForm.classList.add('active'); allUI.registerForm.classList.remove('active'); });
        allUI.authModalCloseBtn.addEventListener('click', () => closeModal(allUI.authModal));
        allUI.authModal.addEventListener('click', (e) => { if (e.target === allUI.authModal) closeModal(allUI.authModal); });
        allUI.switchToRegisterBtn.addEventListener('click', () => { allUI.loginForm.classList.remove('active'); allUI.registerForm.classList.add('active'); });
        allUI.switchToLoginBtn.addEventListener('click', () => { allUI.registerForm.classList.remove('active'); allUI.loginForm.classList.add('active'); });
        
        // --- Логика админ-панели ---
        allUI.adminPanelBtn.addEventListener('click', () => {
            renderAdminList();
            openModal(allUI.adminPanelModal);
        });
        allUI.adminModalCloseBtn.addEventListener('click', () => closeModal(allUI.adminPanelModal));
        allUI.adminPanelModal.addEventListener('click', (e) => { if (e.target === allUI.adminPanelModal) closeModal(allUI.adminPanelModal); });


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
                // Проверка на админа
                if (user.uid === adminUid) {
                    allUI.adminPanelBtn.style.display = 'flex';
                } else {
                    allUI.adminPanelBtn.style.display = 'none';
                }
            } else {
                allUI.profileLoginBtn.style.display = 'block';
                allUI.profileArea.style.display = 'none';
                allUI.adminPanelBtn.style.display = 'none';
            }
        });
        
        function getAuthErrorMessage(errorCode) { switch (errorCode) { case 'auth/invalid-email': return 'Неверный формат email адреса.'; case 'auth/user-not-found': case 'auth/wrong-password': case 'auth/invalid-credential': return 'Неверный email или пароль.'; case 'auth/email-already-in-use': return 'Этот email уже зарегистрирован.'; case 'auth/weak-password': return 'Пароль слишком слабый (минимум 6 символов).'; default: return 'Произошла неизвестная ошибка. Попробуйте снова.'; } }

        // --- НОВАЯ ЛОГИКА: Firestore, Поиск, Фильтрация и Сортировка ---
        
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
        
        async function seedDatabase() {
            const brandsCollection = collection(db, "brands");
            const initialQuery = query(brandsCollection, limit(1));
            const snapshot = await getDocs(initialQuery);
            if (snapshot.empty) {
                console.log("База данных пуста. Заполняем...");
                const initialBrands = [ { name: "Audi", country: "de", continent: "europe" }, { name: "BMW", country: "de", continent: "europe" }, { name: "Ford", country: "us", continent: "america" }, { name: "Honda", country: "jp", continent: "asia" }, { name: "Hyundai", country: "kr", continent: "asia" }, { name: "Kia", country: "kr", continent: "asia" }, { name: "Lexus", country: "jp", continent: "asia" }, { name: "Mazda", country: "jp", continent: "asia" }, { name: "Mercedes", country: "de", continent: "europe" }, { name: "Mitsubishi", country: "jp", continent: "asia" }, { name: "Nissan", country: "jp", continent: "asia" }, { name: "Subaru", country: "jp", continent: "asia" }, { name: "Toyota", country: "jp", continent: "asia" }, { name: "Volkswagen", country: "de", continent: "europe" }, { name: "Volvo", country: "se", continent: "europe" }, { name: "Lada", country: "ru", continent: "europe" }, { name: "Land Rover", country: "gb", continent: "europe" }, { name: "Renault", country: "fr", continent: "europe" }, { name: "Peugeot", country: "fr", continent: "europe" }, { name: "Fiat", country: "it", continent: "europe" }, { name: "Skoda", country: "cz", continent: "europe" }, { name: "Chevrolet", country: "us", continent: "america" } ];
                for (const brand of initialBrands) { await addDoc(brandsCollection, brand); }
                console.log("База данных успешно заполнена.");
            }
        }

        // --- CRUD операции для админ-панели ---
        function renderAdminList() {
            allUI.adminBrandsList.innerHTML = '';
            const sortedList = [...masterBrandList].sort((a,b) => a.name.localeCompare(b.name));
            sortedList.forEach(brand => {
                const item = document.createElement('div');
                item.className = 'admin-brand-item';
                item.innerHTML = `
                    <div class="admin-brand-info">
                        <span><strong>${brand.name}</strong></span>
                        <span>${brand.continent}</span>
                        <span>${brand.country}</span>
                    </div>
                    <div class="admin-brand-actions">
                        <button class="edit-btn" data-id="${brand.id}" title="Редактировать">✏️</button>
                        <button class="delete-btn" data-id="${brand.id}" title="Удалить">🗑️</button>
                    </div>
                `;
                allUI.adminBrandsList.appendChild(item);
            });
        }

        allUI.adminBrandForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = allUI.adminBrandId.value;
            const brandData = {
                name: allUI.adminBrandName.value,
                continent: allUI.adminBrandContinent.value,
                country: allUI.adminBrandCountry.value.toLowerCase(),
            };
            try {
                if (id) { // Редактирование
                    const brandRef = doc(db, 'brands', id);
                    await updateDoc(brandRef, brandData);
                } else { // Добавление
                    await addDoc(collection(db, 'brands'), brandData);
                }
                allUI.adminBrandForm.reset();
                allUI.adminBrandId.value = '';
                allUI.adminFormTitle.textContent = 'Добавить новую марку';
                allUI.adminFormSubmitBtn.textContent = 'Добавить марку';
                allUI.adminFormCancelBtn.style.display = 'none';
            } catch (error) {
                console.error("Ошибка при сохранении марки: ", error);
            }
        });

        allUI.adminBrandsList.addEventListener('click', (e) => {
            const target = e.target.closest('button');
            if (!target) return;
            const id = target.dataset.id;
            
            if (target.classList.contains('edit-btn')) {
                const brand = masterBrandList.find(b => b.id === id);
                allUI.adminBrandId.value = brand.id;
                allUI.adminBrandName.value = brand.name;
                allUI.adminBrandContinent.value = brand.continent;
                allUI.adminBrandCountry.value = brand.country;
                allUI.adminFormTitle.textContent = 'Редактировать марку';
                allUI.adminFormSubmitBtn.textContent = 'Сохранить изменения';
                allUI.adminFormCancelBtn.style.display = 'block';
            }
            if (target.classList.contains('delete-btn')) {
                if (confirm(`Вы уверены, что хотите удалить эту марку?`)) {
                    deleteDoc(doc(db, 'brands', id));
                }
            }
        });
        
        allUI.adminFormCancelBtn.addEventListener('click', () => {
            allUI.adminBrandForm.reset();
            allUI.adminBrandId.value = '';
            allUI.adminFormTitle.textContent = 'Добавить новую марку';
            allUI.adminFormSubmitBtn.textContent = 'Добавить марку';
            allUI.adminFormCancelBtn.style.display = 'none';
        });

        // --- Инициализация страницы ---
        document.addEventListener('DOMContentLoaded', async () => {
            const countries = { 'de': 'Германия', 'jp': 'Япония', 'us': 'США', 'kr': 'Корея', 'se': 'Швеция', 'ru': 'Россия', 'gb': 'Англия', 'fr': 'Франция', 'it': 'Италия', 'cz': 'Чехия' };
            Object.entries(countries).forEach(([code, name]) => {
                const option = document.createElement('option');
                option.value = code;
                option.textContent = name;
                allUI.countrySelect.appendChild(option);
            });
            
            await seedDatabase();

            // Слушаем изменения в коллекции брендов в реальном времени
            const brandsCollection = collection(db, "brands");
            onSnapshot(brandsCollection, (querySnapshot) => {
                masterBrandList = [];
                querySnapshot.forEach((doc) => {
                    masterBrandList.push({ id: doc.id, ...doc.data() });
                });
                allUI.loader.style.display = 'none';
                applyFiltersAndSorting();
                // Обновляем список в админке, если она открыта
                if (allUI.adminPanelModal.classList.contains('is-visible')) {
                    renderAdminList();
                }
            });

            // Навешиваем слушатели на элементы управления
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
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { firebaseConfig, adminUid } from './config.js';

// Инициализация Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Элементы UI
const loginSection = document.getElementById('admin-login-section');
const panelSection = document.getElementById('admin-panel-section');
const loginForm = document.getElementById('admin-login-form');
const loginError = document.getElementById('admin-login-error');
const logoutBtn = document.getElementById('admin-logout-btn');
const brandForm = document.getElementById('admin-brand-form');
const brandsListContainer = document.getElementById('admin-brands-list');
const formTitle = document.getElementById('admin-form-title');
const submitBtn = document.getElementById('admin-form-submit-btn');
const cancelBtn = document.getElementById('admin-form-cancel-btn');
const brandIdField = document.getElementById('admin-brand-id');

let masterBrandList = [];

// Проверка состояния авторизации
onAuthStateChanged(auth, user => {
    if (user && user.uid === adminUid) {
        // Пользователь - админ и он вошел
        loginSection.classList.add('hidden');
        panelSection.classList.remove('hidden');
        setupAdminPanelListeners();
    } else {
        // Пользователь не админ или не вошел
        loginSection.classList.remove('hidden');
        panelSection.classList.add('hidden');
    }
});

// Вход админа
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-login-email').value;
    const password = document.getElementById('admin-login-password').value;
    loginError.classList.add('hidden');

    signInWithEmailAndPassword(auth, email, password)
        .catch(error => {
            loginError.textContent = "Неверный email или пароль.";
            loginError.classList.remove('hidden');
        });
});

// Выход админа
logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

function setupAdminPanelListeners() {
    const brandsCollection = collection(db, "brands");

    // Слушаем изменения в БД в реальном времени
    onSnapshot(brandsCollection, (snapshot) => {
        masterBrandList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAdminList();
    });

    // Обработка формы (добавление/редактирование)
    brandForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = brandIdField.value;
        const brandData = {
            name: document.getElementById('admin-brand-name').value,
            continent: document.getElementById('admin-brand-continent').value,
            country: document.getElementById('admin-brand-country').value.toLowerCase(),
        };

        try {
            if (id) {
                await updateDoc(doc(db, 'brands', id), brandData);
            } else {
                await addDoc(brandsCollection, brandData);
            }
            resetForm();
        } catch (error) {
            console.error("Ошибка сохранения:", error);
        }
    });

    // Обработка кнопок редактирования и удаления
    brandsListContainer.addEventListener('click', (e) => {
        const target = e.target.closest('button');
        if (!target) return;
        const id = target.dataset.id;

        if (target.classList.contains('edit-btn')) {
            const brand = masterBrandList.find(b => b.id === id);
            brandIdField.value = brand.id;
            document.getElementById('admin-brand-name').value = brand.name;
            document.getElementById('admin-brand-continent').value = brand.continent;
            document.getElementById('admin-brand-country').value = brand.country;
            formTitle.textContent = 'Редактировать марку';
            submitBtn.textContent = 'Сохранить';
            cancelBtn.style.display = 'inline-block';
        }

        if (target.classList.contains('delete-btn')) {
            if (confirm('Удалить эту марку?')) {
                deleteDoc(doc(db, 'brands', id));
            }
        }
    });

    // Кнопка отмены редактирования
    cancelBtn.addEventListener('click', resetForm);
}

function renderAdminList() {
    brandsListContainer.innerHTML = '';
    const sortedList = [...masterBrandList].sort((a, b) => a.name.localeCompare(b.name));
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
        brandsListContainer.appendChild(item);
    });
}

function resetForm() {
    brandForm.reset();
    brandIdField.value = '';
    formTitle.textContent = 'Добавить новую марку';
    submitBtn.textContent = 'Добавить марку';
    cancelBtn.style.display = 'none';
}

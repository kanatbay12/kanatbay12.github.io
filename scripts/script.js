// СКРИПТ ДЛЯ УПРАВЛЕНИЯ МЕНЮ
        document.addEventListener('DOMContentLoaded', () => {
            const menuToggleBtn = document.getElementById('menu-toggle-btn');
            const sideNav = document.getElementById('side-nav');

            if (menuToggleBtn && sideNav) {
                // Открытие/закрытие меню по клику на кнопку
                menuToggleBtn.addEventListener('click', (event) => {
                    event.stopPropagation(); // Предотвращаем "всплытие" события
                    menuToggleBtn.classList.toggle('is-active');
                    sideNav.classList.toggle('is-open');
                });

                // Закрытие меню по клику вне его области
                document.addEventListener('click', (event) => {
                    const isClickInsideNav = sideNav.contains(event.target);
                    const isClickOnToggleBtn = menuToggleBtn.contains(event.target);

                    if (!isClickInsideNav && !isClickOnToggleBtn && sideNav.classList.contains('is-open')) {
                        menuToggleBtn.classList.remove('is-active');
                        sideNav.classList.remove('is-open');
                    }
                });
            }
        });

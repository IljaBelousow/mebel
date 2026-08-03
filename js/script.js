// ============================================================
// 1. HEADER SCROLL SHADOW
// ============================================================
window.addEventListener('scroll', () => {
    const header = document.getElementById('header');
    if (header) {
        header.classList.toggle('scrolled', window.scrollY > 50);
    }
});

// ============================================================
// 2. ГЛАВНЫЙ СЛАЙДЕР (только на index.html)
// ============================================================
const slider = document.getElementById('heroSlider');
if (slider) {
    const slides = slider.querySelectorAll('.hero-slider-slide');
    const total = slides.length;
    let idx = 0,
        isMoving = false;
    const dotsContainer = document.getElementById('sliderDots');

    // Создаём точки
    slides.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.classList.add('slider-dot');
        if (i === 0) dot.classList.add('active');
        dot.dataset.index = i;
        dot.addEventListener('click', () => goTo(i));
        dotsContainer.appendChild(dot);
    });
    const dots = dotsContainer.querySelectorAll('.slider-dot');

    function goTo(index) {
        if (isMoving || index === idx) return;
        isMoving = true;
        idx = index;
        slider.style.transform = `translateX(-${idx * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
        setTimeout(() => isMoving = false, 600);
    }

    document.getElementById('sliderNext').addEventListener('click', () => {
        goTo((idx + 1) % total);
    });
    document.getElementById('sliderPrev').addEventListener('click', () => {
        goTo((idx - 1 + total) % total);
    });

    // Автоплей
    let autoInterval = setInterval(() => {
        goTo((idx + 1) % total);
    }, 5000);

    // Остановка при наведении
    const wrapper = slider.closest('.hero-slider-wrapper');
    wrapper.addEventListener('mouseenter', () => clearInterval(autoInterval));
    wrapper.addEventListener('mouseleave', () => {
        autoInterval = setInterval(() => {
            goTo((idx + 1) % total);
        }, 5000);
    });
}

// ============================================================
// 3. MDF АВТОПЛЕЙ (только на index.html)
// ============================================================
const mdfItems = document.querySelectorAll('.mdf-item');
if (mdfItems.length) {
    let mdfIdx = 0,
        mdfInterval;

    function activateMdf(i) {
        mdfItems.forEach((el, idx) => el.classList.toggle('active', idx === i));
    }

    function nextMdf() {
        mdfIdx = (mdfIdx + 1) % mdfItems.length;
        activateMdf(mdfIdx);
    }

    function startMdf() {
        mdfInterval = setInterval(nextMdf, 4000);
    }

    function stopMdf() {
        clearInterval(mdfInterval);
    }
    startMdf();
    const mdfGrid = document.getElementById('mdfGrid');
    if (mdfGrid) {
        mdfGrid.addEventListener('mouseenter', stopMdf);
        mdfGrid.addEventListener('mouseleave', startMdf);
    }
}

// ============================================================
// 4. ФИЛЬТРЫ ПОРТФОЛИО + МОДАЛЬНОЕ ОКНО
// ============================================================
const filterBtns = document.querySelectorAll('.filter-btn');
const galleryItems = document.querySelectorAll('.gallery-item');

if (filterBtns.length) {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const filter = this.dataset.filter;
            galleryItems.forEach(item => {
                if (filter === 'all' || item.dataset.category === filter) {
                    item.style.display = 'block';
                    item.style.animation = 'fadeUp 0.5s ease';
                } else {
                    item.style.display = 'none';
                }
            });
        });
    });
}

// Модалка
const modalOverlay = document.getElementById('modalOverlay');
const modalClose = document.getElementById('modalClose');
const modalImage = document.getElementById('modalImage');
const modalTitle = document.getElementById('modalTitle');
const modalCategory = document.getElementById('modalCategory');
const modalDesc = document.getElementById('modalDesc');

// Данные проектов (можно расширять)
const projectData = {
    'Кухонный гарнитур': {
        category: 'Кухня',
        desc: 'Современный кухонный гарнитур в цвете «графит» с глянцевым покрытием. Фасады изготовлены из МДФ с высокой точностью фрезеровки. Срок изготовления — 5 дней.'
    },
    'Шкаф-купе': {
        category: 'Шкаф',
        desc: 'Встроенный шкаф-купе с матовым покрытием. Индивидуальный дизайн, идеально вписывается в интерьер спальни. Срок изготовления — 4 дня.'
    },
    'Межкомнатные двери': {
        category: 'Двери',
        desc: 'Комплект межкомнатных дверей с глянцевым покрытием. Цвет — белый глянец, фурнитура в тон. Срок изготовления — 3 дня.'
    },
    'Мягкая мебель': {
        category: 'Мебель',
        desc: 'Обновление внешнего вида мягкой мебели. Покраска тканевых элементов, восстановление цвета. Срок — 5 дней.'
    },
    'Эксклюзивный проект': {
        category: 'Премиум',
        desc: 'Эксклюзивный проект с покрытием софт-тач. Бархатистая поверхность, уникальный дизайн. Срок изготовления — 7 дней.'
    },
    'Кухня в стиле лофт': {
        category: 'Кухня',
        desc: 'Кухня в стиле лофт с матовым покрытием. Сочетание дерева и МДФ, строгие линии, индустриальный стиль. Срок изготовления — 6 дней.'
    }
};

if (modalOverlay) {
    galleryItems.forEach(item => {
        item.addEventListener('click', function() {
            const title = this.querySelector('.title').textContent;
            const imgSrc = this.querySelector('img').getAttribute('src');
            const badge = this.querySelector('.badge').textContent;
            const data = projectData[title] || {
                category: badge,
                desc: 'Подробности проекта уточняйте у менеджеров.'
            };

            modalImage.src = imgSrc;
            modalTitle.textContent = title;
            modalCategory.textContent = data.category;
            modalDesc.textContent = data.desc;
            modalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
    });

    function closeModal() {
        modalOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeModal();
    });
}

// ============================================================
// 5. ФОРМА ОБРАТНОЙ СВЯЗИ (contacts.html)
// ============================================================
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в ближайшее время.');
        this.reset();
    });
    // ===== BURGER MENU =====
    const burger = document.getElementById('burger');
    const mobileMenu = document.getElementById('mobileMenu');
    const overlay = document.getElementById('mobileOverlay');

    if (burger) {
        function toggleMenu() {
            burger.classList.toggle('active');
            mobileMenu.classList.toggle('active');
            overlay.classList.toggle('active');
            document.body.style.overflow = document.body.style.overflow === 'hidden' ? '' : 'hidden';
        }

        burger.addEventListener('click', toggleMenu);

        // Закрытие по клику на оверлей
        overlay.addEventListener('click', toggleMenu);

        // Закрытие после выбора пункта
        document.querySelectorAll('.mobile-menu a').forEach(link => {
            link.addEventListener('click', toggleMenu);
        });

        // Закрытие по Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
                toggleMenu();
            }
        });
    }
}
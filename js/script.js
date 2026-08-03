// ============================================================
// УТИЛИТЫ
// ============================================================
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function debounce(fn, wait = 20) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), wait);
    };
}

const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

// ============================================================
// ФИКС СКРОЛЛА
// ============================================================
function unlockScroll() {
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
}
unlockScroll();


// ============================================================
// 1. HEADER SCROLL SHADOW
// ============================================================
const header = $('#header');
if (header) {
    const handleScroll = debounce(() => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    }, 10);

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
}


// ============================================================
// 2. BURGER MENU
// ============================================================
const burger = $('#burger');
const mobileMenu = $('#mobileMenu');
const mobileOverlay = $('#mobileOverlay');

if (burger && mobileMenu && mobileOverlay) {
    const body = document.body;

    function toggleMenu(forceState) {
        const isOpen = typeof forceState === 'boolean' ?
            forceState :
            !mobileMenu.classList.contains('active');

        burger.classList.toggle('active', isOpen);
        mobileMenu.classList.toggle('active', isOpen);
        mobileOverlay.classList.toggle('active', isOpen);

        burger.setAttribute('aria-expanded', String(isOpen));
        mobileMenu.setAttribute('aria-hidden', String(!isOpen));
        mobileOverlay.setAttribute('aria-hidden', String(!isOpen));

        if (isOpen) {
            body.style.overflow = 'hidden';
            setTimeout(() => {
                const firstLink = mobileMenu.querySelector('a');
                if (firstLink) firstLink.focus();
            }, 400);
        } else {
            unlockScroll();
            burger.focus();
        }
    }

    burger.addEventListener('click', () => toggleMenu());
    mobileOverlay.addEventListener('click', () => toggleMenu(false));

    $$('a', mobileMenu).forEach(link => {
        link.addEventListener('click', () => toggleMenu(false));
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
            toggleMenu(false);
        }
    });

    window.addEventListener('resize', debounce(() => {
        if (window.innerWidth > 768) {
            if (mobileMenu.classList.contains('active')) {
                toggleMenu(false);
            }
            unlockScroll();
        }
    }, 100));

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    $$('a', mobileMenu).forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('active');
        }
    });
}


// ============================================================
// 3. HERO SLIDER (свайпы через Pointer Events)
// ============================================================
const slider = $('#heroSlider');
if (slider) {
    const slides = $$('.hero-slider-slide', slider);
    const total = slides.length;
    let idx = 0;
    let isMoving = false;
    let autoInterval = null;

    const dotsContainer = $('#sliderDots');
    const prevBtn = $('#sliderPrev');
    const nextBtn = $('#sliderNext');
    const wrapper = slider.closest('.hero-slider-wrapper');

    if (dotsContainer) {
        slides.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
            dot.dataset.index = i;
            dot.setAttribute('aria-label', `Слайд ${i + 1}`);
            dot.addEventListener('click', () => goTo(i));
            dotsContainer.appendChild(dot);
        });
    }
    const dots = dotsContainer ? $$('.slider-dot', dotsContainer) : [];

    function goTo(index) {
        if (isMoving || total === 0) return;
        if (index === idx) return;

        isMoving = true;
        idx = ((index % total) + total) % total;
        slider.style.transform = `translateX(-${idx * 100}%)`;
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));

        setTimeout(() => isMoving = false, 600);
    }

    if (nextBtn) nextBtn.addEventListener('click', () => goTo(idx + 1));
    if (prevBtn) prevBtn.addEventListener('click', () => goTo(idx - 1));

    function startAutoPlay() {
        stopAutoPlay();
        autoInterval = setInterval(() => goTo(idx + 1), 5000);
    }

    function stopAutoPlay() {
        if (autoInterval) {
            clearInterval(autoInterval);
            autoInterval = null;
        }
    }

    if (wrapper) {
        wrapper.addEventListener('mouseenter', stopAutoPlay);
        wrapper.addEventListener('mouseleave', startAutoPlay);

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) stopAutoPlay();
            else startAutoPlay();
        });
    }

    // ===== СВАЙПЫ (Pointer Events — телефон + ПК) =====
    if (wrapper) {
        let pointerStartX = 0;
        let pointerStartY = 0;
        let isDragging = false;

        wrapper.addEventListener('pointerdown', (e) => {
            pointerStartX = e.clientX;
            pointerStartY = e.clientY;
            isDragging = true;
            stopAutoPlay();
            wrapper.setPointerCapture(e.pointerId);
        }, { passive: true });

        wrapper.addEventListener('pointerup', (e) => {
            if (!isDragging) return;
            isDragging = false;

            const diffX = pointerStartX - e.clientX;
            const diffY = Math.abs(pointerStartY - e.clientY);
            const threshold = 50;

            if (Math.abs(diffX) > threshold && Math.abs(diffX) > diffY) {
                if (diffX > 0) goTo(idx + 1);
                else goTo(idx - 1);
            }

            startAutoPlay();
        });

        wrapper.addEventListener('pointercancel', () => {
            isDragging = false;
            startAutoPlay();
        });

        wrapper.addEventListener('dragstart', (e) => e.preventDefault());
    }

    // Клавиатура
    if (wrapper) {
        wrapper.setAttribute('tabindex', '0');
        wrapper.setAttribute('role', 'region');
        wrapper.setAttribute('aria-roledescription', 'carousel');

        wrapper.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                goTo(idx + 1);
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                goTo(idx - 1);
            }
        });
    }

    startAutoPlay();
}


// ============================================================
// 4. MDF AUTOPLAY
// ============================================================
const mdfItems = $$('.mdf-item');
if (mdfItems.length) {
    let mdfIdx = 0;
    let mdfInterval = null;
    const mdfGrid = $('#mdfGrid');

    function activateMdf(i) {
        mdfItems.forEach((el, index) => el.classList.toggle('active', index === i));
    }

    function nextMdf() {
        mdfIdx = (mdfIdx + 1) % mdfItems.length;
        activateMdf(mdfIdx);
    }

    function startMdf() {
        if (mdfInterval) return;
        mdfInterval = setInterval(nextMdf, 4000);
    }

    function stopMdf() {
        if (mdfInterval) {
            clearInterval(mdfInterval);
            mdfInterval = null;
        }
    }

    startMdf();

    if (mdfGrid) {
        mdfGrid.addEventListener('mouseenter', stopMdf);
        mdfGrid.addEventListener('mouseleave', startMdf);
        mdfGrid.addEventListener('touchstart', stopMdf, { passive: true });
        mdfGrid.addEventListener('touchend', () => {
            setTimeout(startMdf, 2000);
        }, { passive: true });
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopMdf();
        else startMdf();
    });
}


// ============================================================
// 5. PORTFOLIO FILTERS
// ============================================================
const filterBtns = $$('.filter-btn');
const galleryItems = $$('.gallery-item');

if (filterBtns.length && galleryItems.length) {
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const filter = this.dataset.filter;

            galleryItems.forEach(item => {
                const show = filter === 'all' || item.dataset.category === filter;
                item.style.display = show ? '' : 'none';

                if (show) {
                    item.style.animation = 'none';
                    void item.offsetWidth;
                    item.style.animation = 'fadeUp 0.5s ease';
                }
            });
        });
    });
}


// ============================================================
// 6. СЛАЙДЕРЫ ВНУТРИ КАРТОЧЕК ГАЛЕРЕИ (свайпы + стрелки)
// ============================================================
function initGallerySliders() {
    const items = $$('.gallery-item');

    items.forEach(item => {
        const sliderEl = $('.gallery-slider', item);
        if (!sliderEl) return;

        const images = $$('img', sliderEl);
        if (images.length <= 1) return;

        let currentIdx = 0;
        let hasSwiped = false;

        // Создаём стрелки если их нет
        let prevArrow = $('.gallery-arrow-prev', item);
        let nextArrow = $('.gallery-arrow-next', item);

        if (!prevArrow) {
            prevArrow = document.createElement('button');
            prevArrow.className = 'gallery-arrow gallery-arrow-prev';
            prevArrow.setAttribute('aria-label', 'Предыдущее фото');
            prevArrow.innerHTML = '‹';
            item.appendChild(prevArrow);
        }

        if (!nextArrow) {
            nextArrow = document.createElement('button');
            nextArrow.className = 'gallery-arrow gallery-arrow-next';
            nextArrow.setAttribute('aria-label', 'Следующее фото');
            nextArrow.innerHTML = '›';
            item.appendChild(nextArrow);
        }

        // Создаём точки
        let dotsWrap = $('.gallery-dots', item);
        if (!dotsWrap) {
            dotsWrap = document.createElement('div');
            dotsWrap.className = 'gallery-dots';
            item.appendChild(dotsWrap);
        }

        images.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'gallery-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', `Фото ${i + 1}`);
            dot.addEventListener('click', (e) => {
                e.stopPropagation();
                showImage(i);
            });
            dotsWrap.appendChild(dot);
        });

        const dots = $$('.gallery-dot', dotsWrap);

        function showImage(index) {
            currentIdx = ((index % images.length) + images.length) % images.length;
            images.forEach((img, i) => {
                img.classList.toggle('active', i === currentIdx);
            });
            dots.forEach((d, i) => {
                d.classList.toggle('active', i === currentIdx);
            });
        }

        // Стрелки
        prevArrow.addEventListener('click', (e) => {
            e.stopPropagation();
            showImage(currentIdx - 1);
        });

        nextArrow.addEventListener('click', (e) => {
            e.stopPropagation();
            showImage(currentIdx + 1);
        });

        // Свайпы через Pointer Events
        let startX = 0;
        let startY = 0;
        let isDragging = false;

        sliderEl.addEventListener('pointerdown', (e) => {
            startX = e.clientX;
            startY = e.clientY;
            isDragging = true;
            hasSwiped = false;
            sliderEl.setPointerCapture(e.pointerId);
        }, { passive: true });

        sliderEl.addEventListener('pointerup', (e) => {
            if (!isDragging) return;
            isDragging = false;

            const diffX = startX - e.clientX;
            const diffY = Math.abs(startY - e.clientY);
            const threshold = 30;

            if (Math.abs(diffX) > threshold && Math.abs(diffX) > diffY) {
                hasSwiped = true;
                if (diffX > 0) showImage(currentIdx + 1);
                else showImage(currentIdx - 1);
            }
        });

        sliderEl.addEventListener('pointercancel', () => {
            isDragging = false;
        });

        // Предотвращаем открытие модалки после свайпа
        item.addEventListener('click', (e) => {
            if (hasSwiped) {
                e.preventDefault();
                e.stopPropagation();
                hasSwiped = false;
            }
        }, true);

        // Предотвращаем выделение текста
        sliderEl.addEventListener('dragstart', (e) => e.preventDefault());
    });
}

initGallerySliders();


// ============================================================
// 7. МОДАЛЬНОЕ ОКНО ПОРТФОЛИО
// ============================================================
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

const modalOverlay = $('#modalOverlay');
if (modalOverlay) {
    const modalClose = $('#modalClose');
    const modalImage = $('#modalImage');
    const modalTitle = $('#modalTitle');
    const modalCategory = $('#modalCategory');
    const modalDesc = $('#modalDesc');

    galleryItems.forEach(item => {
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', 'Открыть подробности проекта');

        const openModal = () => {
            const titleEl = $('.title', item);
            const imgEl = $('img', item);
            const badgeEl = $('.badge', item);

            const title = titleEl ? titleEl.textContent : '';
            const imgSrc = imgEl ? imgEl.getAttribute('src') : '';
            const badge = badgeEl ? badgeEl.textContent : '';

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

            if (modalClose) {
                setTimeout(() => modalClose.focus(), 100);
            }
        };

        item.addEventListener('click', openModal);
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openModal();
            }
        });
    });

    function closeModal() {
        modalOverlay.classList.remove('active');
        unlockScroll();
    }

    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
            closeModal();
        }
    });
}


// ============================================================
// 8. ФОРМА ОБРАТНОЙ СВЯЗИ
// ============================================================
const contactForm = $('#contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const name = $('#name', this);
        const phone = $('#phone', this);

        if (name && name.value.trim().length < 2) {
            alert('Пожалуйста, введите ваше имя');
            name.focus();
            return;
        }

        if (phone && phone.value.replace(/\D/g, '').length < 10) {
            alert('Пожалуйста, введите корректный номер телефона');
            phone.focus();
            return;
        }

        alert('Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в ближайшее время.');
        this.reset();
    });

    const phoneInput = $('#phone', contactForm);
    if (phoneInput) {
        phoneInput.addEventListener('input', function() {
            let val = this.value.replace(/\D/g, '');

            if (val.length === 0) {
                this.value = '';
                return;
            }

            if (val[0] === '8') val = '375' + val.slice(1);
            if (val[0] === '7') val = '375' + val.slice(1);
            if (!val.startsWith('375')) val = '375' + val;
            val = val.slice(0, 12);

            let formatted = '+375';
            if (val.length > 3) formatted += ' (' + val.slice(3, 5);
            if (val.length > 5) formatted += ') ' + val.slice(5, 8);
            if (val.length > 8) formatted += '-' + val.slice(8, 10);
            if (val.length > 10) formatted += '-' + val.slice(10, 12);

            this.value = formatted;
        });

        phoneInput.addEventListener('focus', function() {
            if (!this.value) this.value = '+375 ';
        });

        phoneInput.addEventListener('blur', function() {
            if (this.value === '+375 ' || this.value === '+375') {
                this.value = '';
            }
        });
    }
}


// ============================================================
// 9. SMOOTH SCROLL
// ============================================================
$$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId === '#' || targetId.length < 2) return;

        const target = $(targetId);
        if (target) {
            e.preventDefault();
            const headerHeight = header ? header.offsetHeight : 0;
            const targetPos = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;

            window.scrollTo({ top: targetPos, behavior: 'smooth' });
        }
    });
});


// ============================================================
// 10. LAZY LOADING
// ============================================================
if ('loading' in HTMLImageElement.prototype) {
    $$('img[loading="lazy"]').forEach(img => {
        if (img.dataset.src) img.src = img.dataset.src;
    });
} else {
    const lazyImages = $$('img[data-src]');
    if (lazyImages.length && 'IntersectionObserver' in window) {
        const imgObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        }, { rootMargin: '50px 0px', threshold: 0.01 });

        lazyImages.forEach(img => imgObserver.observe(img));
    }
}


// ============================================================
// 11. АВТОПОДСТРОЙКА ВЫСОТЫ
// ============================================================
function setVh() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

setVh();
window.addEventListener('resize', debounce(setVh, 100));


// ============================================================
// ГОТОВО
// ============================================================
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
    unlockScroll();
    console.log('🚀 Vintazh100 website initialized');
});

(function () {
        'use strict';

        if (window.gsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const isIndex = !!document.getElementById('hero-text');
        let lenis = null;

        function ready(fn) {
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
            else fn();
        }



        function initThemeToggle() {
            const buttons = Array.from(document.querySelectorAll('[data-theme-toggle]'));
            const root = document.documentElement;
            const metaTheme = document.querySelector('meta[name="theme-color"]');
            const storageKey = 'fady-theme';

            function readStoredTheme() {
                try {
                    const stored = window.localStorage.getItem(storageKey);
                    return stored === 'dark' || stored === 'light' ? stored : null;
                } catch (error) {
                    return null;
                }
            }

            function saveTheme(theme) {
                try {
                    window.localStorage.setItem(storageKey, theme);
                } catch (error) {
                    // Storage can be blocked in private browsers; the toggle still works for this page load.
                }
            }

            function applyTheme(theme, shouldSave) {
                const nextTheme = theme === 'dark' ? 'dark' : 'light';
                root.setAttribute('data-theme', nextTheme);
                document.body.classList.toggle('theme-dark', nextTheme === 'dark');
                document.body.classList.toggle('theme-light', nextTheme !== 'dark');
                if (metaTheme) metaTheme.setAttribute('content', nextTheme === 'dark' ? '#050505' : '#ffffff');

                buttons.forEach(button => {
                    const nextLabel = nextTheme === 'dark' ? 'Light' : 'Dark';
                    const text = button.querySelector('.theme-toggle-text');
                    button.setAttribute('aria-label', 'Switch to ' + nextLabel.toLowerCase() + ' theme');
                    button.setAttribute('aria-pressed', nextTheme === 'dark' ? 'true' : 'false');
                    if (text) text.textContent = nextLabel;
                    button.dataset.themeState = nextTheme;
                });

                if (window.ScrollTrigger) window.ScrollTrigger.refresh();
                if (shouldSave) saveTheme(nextTheme);
            }

            const initialTheme = readStoredTheme() || 'light';
            applyTheme(initialTheme, false);

            buttons.forEach(button => {
                if (button.dataset.themeReady === 'true') return;
                button.dataset.themeReady = 'true';
                button.addEventListener('click', () => {
                    const current = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
                    applyTheme(current === 'dark' ? 'light' : 'dark', true);
                });
            });
        }

        function initSmoothScroll() {
            if (reduceMotion || window.__fadyLenisReady) return;
            window.__fadyLenisReady = true;

            if (!window.Lenis) return;

            lenis = new Lenis({
                duration: 0.78,
                smoothWheel: true,
                wheelMultiplier: 0.95,
                touchMultiplier: 1.15,
                easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }
            });

            window.__fadyLenis = lenis;
            if (window.ScrollTrigger) lenis.on('scroll', ScrollTrigger.update);

            function raf(time) {
                lenis.raf(time);
                requestAnimationFrame(raf);
            }
            requestAnimationFrame(raf);
        }

        function lockSmoothScroll(lock) {
            if (lenis) {
                if (lock) lenis.stop();
                else lenis.start();
            }
        }

        function initScrollProgress() {
            const bar = document.getElementById('scroll-progress');
            if (!bar || bar.dataset.ready === 'true') return;
            bar.dataset.ready = 'true';

            function update() {
                const max = document.documentElement.scrollHeight - window.innerHeight;
                const progress = max > 0 ? window.scrollY / max : 0;
                bar.style.transform = 'scaleX(' + Math.max(0, Math.min(1, progress)) + ')';
            }

            update();
            window.addEventListener('scroll', update, { passive: true });
            window.addEventListener('resize', update);
        }

        function initMobileMenu() {
            const toggle = document.getElementById('nav-toggle');
            const closeBtn = document.getElementById('mobile-close');
            const menu = document.getElementById('mobile-menu');
            if (!toggle || !menu || toggle.dataset.ready === 'true') return;
            toggle.dataset.ready = 'true';

            function openMenu() {
                toggle.classList.add('is-open');
                menu.classList.add('is-open');
                menu.setAttribute('aria-hidden', 'false');
                document.body.style.overflow = 'hidden';
                lockSmoothScroll(true);
            }

            function closeMenu() {
                toggle.classList.remove('is-open');
                menu.classList.remove('is-open');
                menu.setAttribute('aria-hidden', 'true');
                document.body.style.overflow = '';
                lockSmoothScroll(false);
            }

            toggle.addEventListener('click', () => menu.classList.contains('is-open') ? closeMenu() : openMenu());
            if (closeBtn) closeBtn.addEventListener('click', closeMenu);
            menu.querySelectorAll('[data-menu-link]').forEach(link => link.addEventListener('click', closeMenu));
            document.addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('is-open')) closeMenu(); });
            window.addEventListener('resize', () => { if (window.innerWidth > 900 && menu.classList.contains('is-open')) closeMenu(); });
        }

        function initBackToTop() {
            document.querySelectorAll('#back-top, .back-top, a[href="#top"]').forEach(link => {
                if (link.dataset.backTopReady === 'true') return;
                link.dataset.backTopReady = 'true';
                link.addEventListener('click', e => {
                    const href = link.getAttribute('href') || '';
                    if (href !== '#top') return;
                    e.preventDefault();
                    if (lenis) lenis.scrollTo(0, { duration: 1.0 });
                    else window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            });
        }

        function initCustomCursor() {
            if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
            if (document.querySelector('.custom-cursor')) return;

            const cursor = document.createElement('div');
            cursor.className = 'custom-cursor';
            document.body.appendChild(cursor);

            const hoverTargets = 'a, button, .image-frame, .work-image, .screen-card-media, .taskflow-frame, .btn-prototype, .hero-btn, .contact-cta, .form-submit, .image-lightbox-close';

            document.addEventListener('mousemove', e => {
                cursor.style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px,0)';
                cursor.classList.add('is-visible');
                cursor.classList.toggle('is-hovering', !!e.target.closest(hoverTargets));
                cursor.classList.toggle('is-inverted', !!e.target.closest('.contact, .mobile-menu.is-open'));
                cursor.classList.toggle('is-lightbox', document.body.classList.contains('lightbox-open'));
                cursor.classList.toggle('is-hidden', !!e.target.closest('.slider-wrap'));
            }, { passive: true });

            document.addEventListener('mouseleave', () => cursor.classList.remove('is-visible'));
        }

        function initContactForm() {
            const form = document.getElementById('contactForm');
            if (!form || form.dataset.ready === 'true') return;
            form.dataset.ready = 'true';

            const btn = document.getElementById('formBtn');
            const label = document.getElementById('formBtnLabel');
            const status = document.getElementById('formStatus');
            const honey = document.getElementById('cfHoney');
            const ENDPOINT = 'https://formsubmit.co/ajax/neddarfaddy00@gmail.com';

            function showStatus(type, message) {
                if (!status) return;
                status.textContent = message;
                status.className = 'form-status show ' + type;
            }

            form.addEventListener('submit', async e => {
                e.preventDefault();
                if (honey && honey.value) return;

                const name = (form.elements.name && form.elements.name.value || '').trim();
                const email = (form.elements.email && form.elements.email.value || '').trim();
                const subject = (form.elements.subject && form.elements.subject.value || '').trim();
                const message = (form.elements.message && form.elements.message.value || '').trim();

                if (!name || !email || !subject || !message) {
                    showStatus('error', 'Please fill in all fields.');
                    return;
                }

                if (btn) btn.disabled = true;
                if (label) label.textContent = 'Sending...';
                if (status) status.className = 'form-status';

                try {
                    const res = await fetch(ENDPOINT, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                        body: JSON.stringify({ name, email, subject, message, _subject: 'Portfolio enquiry: ' + subject })
                    });
                    const data = await res.json();
                    if (data.success === 'true' || data.success === true) {
                        showStatus('success', 'Message sent! I will get back to you shortly.');
                        form.reset();
                    } else {
                        showStatus('error', 'Something went wrong. Please email me directly at neddarfaddy00@gmail.com');
                    }
                } catch (err) {
                    showStatus('error', 'Something went wrong. Please email me directly at neddarfaddy00@gmail.com');
                } finally {
                    if (btn) btn.disabled = false;
                    if (label) label.textContent = 'Send Message';
                }
            });
        }

        function initSliders() {
            document.querySelectorAll('.slider-wrap').forEach(wrap => {
                if (wrap.dataset.sliderReady === 'true') return;
                wrap.dataset.sliderReady = 'true';

                const before = wrap.querySelector('.slider-before');
                const handle = wrap.querySelector('.slider-handle');
                if (!before || !handle) return;

                let dragging = false;
                let currentPct = 0.5;
                let targetPct = 0.5;
                let rafId = null;

                function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
                function getPct(clientX) {
                    const rect = wrap.getBoundingClientRect();
                    return clamp((clientX - rect.left) / rect.width, 0.005, 0.995);
                }
                function setPosition(pct) {
                    before.style.clipPath = 'inset(0 ' + ((1 - pct) * 100).toFixed(3) + '% 0 0)';
                    handle.style.left = (pct * 100).toFixed(3) + '%';
                }
                function animate() {
                    const diff = targetPct - currentPct;
                    if (Math.abs(diff) > 0.00005) {
                        currentPct += diff * (dragging ? 0.34 : 0.16);
                        setPosition(currentPct);
                        rafId = requestAnimationFrame(animate);
                    } else {
                        currentPct = targetPct;
                        setPosition(currentPct);
                        rafId = null;
                    }
                }
                function kick() { if (!rafId) rafId = requestAnimationFrame(animate); }

                setPosition(0.5);

                wrap.addEventListener('pointerdown', e => {
                    dragging = true;
                    wrap.classList.add('dragging');
                    if (wrap.setPointerCapture) wrap.setPointerCapture(e.pointerId);
                    targetPct = getPct(e.clientX);
                    kick();
                    e.preventDefault();
                });
                wrap.addEventListener('pointermove', e => {
                    if (!dragging) return;
                    targetPct = getPct(e.clientX);
                    kick();
                });
                function release(e) {
                    dragging = false;
                    wrap.classList.remove('dragging');
                    if (wrap.releasePointerCapture) {
                        try { wrap.releasePointerCapture(e.pointerId); } catch (err) {}
                    }
                    kick();
                }
                wrap.addEventListener('pointerup', release);
                wrap.addEventListener('pointercancel', release);
            });
        }

        function initLightbox() {
            if (document.querySelector('.image-lightbox')) return;

            const lightbox = document.createElement('div');
            lightbox.className = 'image-lightbox';
            lightbox.innerHTML = '<button class="image-lightbox-close" type="button" aria-label="Close image">Close</button><img alt="" />';
            document.body.appendChild(lightbox);

            const img = lightbox.querySelector('img');
            const closeBtn = lightbox.querySelector('button');
            let lastSourceRect = null;
            let isOpen = false;

            function getFinalRect(naturalW, naturalH) {
                const maxW = Math.min(window.innerWidth * 0.92, 1500);
                const maxH = window.innerHeight * 0.88;
                const safeW = naturalW || 16;
                const safeH = naturalH || 9;
                const scale = Math.min(maxW / safeW, maxH / safeH);
                const width = safeW * scale;
                const height = safeH * scale;
                return {
                    left: (window.innerWidth - width) / 2,
                    top: (window.innerHeight - height) / 2,
                    width: width,
                    height: height
                };
            }

            function setCursorLightbox(on) {
                const activeCursor = document.querySelector('.custom-cursor');
                if (!activeCursor) return;
                activeCursor.classList.toggle('is-lightbox', on);
                activeCursor.classList.add('is-visible');
            }

            function open(sourceImg) {
                if (!sourceImg || isOpen) return;
                const frame = sourceImg.closest('.screen-card-media, .image-frame, .work-image, .taskflow-frame') || sourceImg;
                lastSourceRect = frame.getBoundingClientRect();
                const src = sourceImg.currentSrc || sourceImg.src;
                const alt = sourceImg.alt || '';

                isOpen = true;
                img.onload = null;
                img.src = src;
                img.alt = alt;
                document.body.classList.add('lightbox-open');
                document.body.style.overflow = 'hidden';
                lockSmoothScroll(true);
                setCursorLightbox(true);

                function animateIn() {
                    const finalRect = getFinalRect(img.naturalWidth, img.naturalHeight);
                    lightbox.classList.add('is-open');

                    if (window.gsap && !reduceMotion) {
                        gsap.killTweensOf([lightbox, img]);
                        gsap.set(lightbox, { autoAlpha: 1 });
                        gsap.set(img, {
                            position: 'fixed',
                            left: lastSourceRect.left,
                            top: lastSourceRect.top,
                            width: lastSourceRect.width,
                            height: lastSourceRect.height,
                            maxWidth: 'none',
                            maxHeight: 'none',
                            objectFit: 'cover',
                            autoAlpha: 1,
                            scale: 1
                        });
                        gsap.to(img, {
                            left: finalRect.left,
                            top: finalRect.top,
                            width: finalRect.width,
                            height: finalRect.height,
                            duration: 0.58,
                            ease: 'power3.out',
                            overwrite: true
                        });
                    } else {
                        Object.assign(img.style, {
                            position: 'fixed',
                            left: finalRect.left + 'px',
                            top: finalRect.top + 'px',
                            width: finalRect.width + 'px',
                            height: finalRect.height + 'px',
                            maxWidth: 'none',
                            maxHeight: 'none',
                            objectFit: 'contain',
                            opacity: '1'
                        });
                    }
                }

                if (img.complete && img.naturalWidth) animateIn();
                else img.onload = animateIn;
            }

            function close() {
                if (!isOpen) return;
                isOpen = false;

                function cleanup() {
                    lightbox.classList.remove('is-open');
                    document.body.classList.remove('lightbox-open');
                    setCursorLightbox(false);
                    document.body.style.overflow = '';
                    lockSmoothScroll(false);
                    img.removeAttribute('src');
                    img.removeAttribute('style');
                    lastSourceRect = null;
                }

                if (window.gsap && !reduceMotion) {
                    gsap.killTweensOf([lightbox, img]);
                    const target = lastSourceRect || { left: window.innerWidth / 2, top: window.innerHeight / 2, width: 20, height: 20 };
                    gsap.to(img, {
                        left: target.left,
                        top: target.top,
                        width: target.width,
                        height: target.height,
                        autoAlpha: 0.15,
                        duration: 0.30,
                        ease: 'power2.inOut',
                        overwrite: true
                    });
                    gsap.to(lightbox, { autoAlpha: 0, duration: 0.32, ease: 'power2.inOut', onComplete: cleanup });
                } else {
                    cleanup();
                }
            }

            document.addEventListener('click', e => {
                const targetImg = e.target.closest('.image-frame img, .work-image img, .screen-card-media img, .taskflow-frame img');
                if (!targetImg || e.target.closest('.slider-wrap')) return;
                e.preventDefault();
                e.stopPropagation();
                open(targetImg);
            }, true);

            closeBtn.addEventListener('click', close);
            lightbox.addEventListener('click', e => { if (e.target === lightbox) close(); });
            document.addEventListener('keydown', e => { if (e.key === 'Escape' && lightbox.classList.contains('is-open')) close(); });
        }

        function initPageTransitions() {
    /* Do not hijack links when the site is opened directly as file://.
       Chrome treats each local file as a unique security origin, so animated
       JS navigation can throw an unsafe file URL frame error in DevTools.
       On a normal local server or hosted site, the smooth curtain transition stays active. */
    if (window.location.protocol === 'file:' || reduceMotion || !window.gsap) return;
    let curtain = document.querySelector('.page-transition-curtain');
    if (!curtain) {
        curtain = document.createElement('div');
        curtain.className = 'page-transition-curtain';
        document.body.appendChild(curtain);
    }

    gsap.set(curtain, { yPercent: 100, force3D: true });
    window.addEventListener('pageshow', () => gsap.set(curtain, { yPercent: 100, force3D: true }));

    document.addEventListener('click', e => {
        const link = e.target.closest('a[href]');
        if (!link) return;

        const hrefAttr = link.getAttribute('href') || '';
        const url = new URL(link.href, window.location.href);
        const modified = e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
        const samePageHash = url.pathname === window.location.pathname && url.search === window.location.search && url.hash;
        const external = url.protocol !== window.location.protocol || url.host !== window.location.host;
        if (modified || link.target === '_blank' || link.hasAttribute('download') || hrefAttr.startsWith('#') || hrefAttr.startsWith('mailto:') || hrefAttr.startsWith('tel:') || samePageHash || external) return;

        e.preventDefault();
        e.stopPropagation();
        lockSmoothScroll(true);
        gsap.killTweensOf(curtain);
        gsap.set(curtain, { yPercent: 100, force3D: true });
        gsap.to(curtain, {
            yPercent: 0,
            duration: 0.76,
            ease: 'expo.inOut',
            overwrite: true,
            onComplete: () => { window.location.href = url.href; }
        });
    }, true);
}

        function runLoader(done) {
    const loader = document.getElementById('loader');
    const logo = document.getElementById('loader-logo') || document.getElementById('loader-mark');
    const counter = document.querySelector('.loader-counter');
    const numEl = document.getElementById('loader-num');
    const bar = document.getElementById('loader-bar');
    let contentStarted = false;

    function startContentReveal() {
        if (contentStarted) return;
        contentStarted = true;

        /* Prepare intro/scroll animations before the loading class is removed.
           This prevents the brief flash/jump that made the old content fade-up feel janky. */
        if (typeof done === 'function') done();
        document.body.classList.remove('is-loading');
    }

    function hideLoader() {
        lockSmoothScroll(false);
        if (loader) {
            loader.style.display = 'none';
            loader.style.pointerEvents = 'none';
        }
    }

    if (!loader || !window.gsap || reduceMotion) {
        startContentReveal();
        hideLoader();
        return;
    }

    lockSmoothScroll(true);
    gsap.killTweensOf([loader, logo, counter, bar]);
    gsap.set(loader, {
        display: 'flex',
        yPercent: 0,
        force3D: true,
        pointerEvents: 'auto'
    });
    gsap.set([logo, counter], { autoAlpha: 0, y: 4 });
    gsap.set(bar, { scaleX: 0, transformOrigin: 'left center' });
    if (numEl) numEl.textContent = '000';

    const count = { val: 0 };
    const tl = gsap.timeline({
        defaults: { ease: 'power3.out' },
        onComplete: hideLoader
    });

    tl.to([logo, counter], {
            autoAlpha: 1,
            y: 0,
            duration: 0.32,
            stagger: 0.035
        })
        .to(count, {
            val: 100,
            duration: 0.64,
            ease: 'power2.inOut',
            onUpdate: () => {
                if (numEl) numEl.textContent = String(Math.floor(count.val)).padStart(3, '0');
            }
        }, '-=0.04')
        .to(bar, {
            scaleX: 1,
            duration: 0.64,
            ease: 'power2.inOut'
        }, '<')
        .to([logo, counter], {
            autoAlpha: 0,
            y: -6,
            duration: 0.22,
            ease: 'power2.in'
        }, '-=0.02')
        .to(loader, {
            yPercent: -100,
            duration: 0.96,
            ease: 'expo.inOut',
            onStart: startContentReveal
        }, '-=0.02');
}

        function runIntro() {
    const navEls = Array.from(document.querySelectorAll('[data-nav]'));
    const introTargets = isIndex
        ? Array.from(document.querySelectorAll('#hero-text, [data-cta]'))
        : Array.from(document.querySelectorAll('#project-title, .back-link'));

    if (!window.gsap || reduceMotion) {
        [...navEls, ...introTargets].forEach(el => {
            el.style.opacity = '1';
            el.style.visibility = 'visible';
            el.style.transform = 'none';
        });
        return;
    }

    gsap.killTweensOf([...navEls, ...introTargets]);
    gsap.set(navEls, { autoAlpha: 1, y: 0, clearProps: 'transform' });

    if (!introTargets.length) return;

    gsap.fromTo(introTargets,
        { autoAlpha: 0, y: 12, filter: 'blur(6px)' },
        {
            autoAlpha: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: 0.92,
            ease: 'power4.out',
            stagger: 0.075,
            overwrite: true,
            clearProps: 'transform,filter,will-change'
        }
    );
}

        function initScrollReveals() {
    const revealSelectors = '[data-reveal], [data-reveal-image], [data-reveal-item]';
    const allRevealEls = Array.from(document.querySelectorAll(revealSelectors))
        .filter(el => !el.closest('header'));

    if (!window.gsap || !window.ScrollTrigger || reduceMotion) {
        allRevealEls.forEach(el => {
            el.style.opacity = '1';
            el.style.transform = 'none';
            el.style.visibility = 'visible';
        });
        return;
    }
    if (window.__fadyScrollRevealReady) return;
    window.__fadyScrollRevealReady = true;

    const animated = new Set();

    function revealDistance(el) {
        if (el.matches('[data-reveal-image], .video-wrap, .image-frame, .screen-card, .work-item, .taskflow-frame')) return 26;
        return 18;
    }

    function setInitial(el) {
        gsap.set(el, {
            autoAlpha: 0,
            y: revealDistance(el),
            filter: 'blur(5px)',
            force3D: true,
            willChange: 'transform, opacity, filter'
        });
    }

    function revealTargets(targets, opts = {}) {
        const cleanTargets = targets.filter(Boolean);
        if (!cleanTargets.length) return;

        gsap.killTweensOf(cleanTargets);
        gsap.to(cleanTargets, {
            autoAlpha: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: opts.duration || 0.82,
            ease: opts.ease || 'power4.out',
            stagger: opts.stagger || 0.065,
            overwrite: true,
            clearProps: 'transform,filter,will-change'
        });
    }

    const groupSelectors = [
        '.work-stack',
        '.meta-stack',
        '.image-stack',
        '.screen-grid',
        '.screen-notes',
        '.quotes-grid',
        '.pain-grid',
        '.es-pain-grid',
        '.taskflow-stack'
    ];

    document.querySelectorAll(groupSelectors.join(',')).forEach(group => {
        if (group.dataset.revealGroupReady === 'true') return;

        const items = Array.from(group.children).filter(child => {
            if (child.closest('header')) return false;
            return child.matches(revealSelectors) || child.querySelector(revealSelectors) ||
                child.matches('.work-item, .screen-card, .screen-note, .quote-item, .pain-item, .es-pain-item, .meta-block, .image-row, .taskflow-block');
        });

        if (!items.length) return;
        group.dataset.revealGroupReady = 'true';
        items.forEach(item => {
            animated.add(item);
            setInitial(item);
        });

        ScrollTrigger.create({
            trigger: group,
            start: 'top 86%',
            once: true,
            onEnter: () => revealTargets(items, { stagger: 0.08, duration: 0.88 })
        });
    });

    allRevealEls.forEach(el => {
        if (animated.has(el) || el.closest('[data-reveal-group-ready="true"]')) return;
        if (el.dataset.revealReady === 'true') return;
        el.dataset.revealReady = 'true';
        setInitial(el);

        ScrollTrigger.create({
            trigger: el,
            start: 'top 88%',
            once: true,
            onEnter: () => revealTargets([el], { stagger: 0, duration: el.matches('[data-reveal-image]') ? 0.92 : 0.78 })
        });
    });

    ScrollTrigger.refresh();
}

        function initSelectedWorkHover() {
            if (!isIndex || !window.gsap || reduceMotion) return;
            document.querySelectorAll('.work-item').forEach(item => {
                if (item.dataset.hoverReady === 'true') return;
                item.dataset.hoverReady = 'true';
                const title = item.querySelector('.work-title');
                const tag = item.querySelector('.work-tag');
                const arrow = item.querySelector('.work-arrow');

                item.addEventListener('pointerenter', () => {
                    gsap.killTweensOf([title, tag, arrow]);
                    gsap.to(title, { x: 12, duration: 0.38, ease: 'power3.out' });
                    gsap.to(tag, { x: 12, autoAlpha: 0.72, duration: 0.38, ease: 'power3.out' });
                    gsap.to(arrow, { x: 8, y: -8, scale: 1.18, duration: 0.38, ease: 'power3.out' });
                });

                item.addEventListener('pointerleave', () => {
                    gsap.killTweensOf([title, tag, arrow]);
                    gsap.to([title, tag], { x: 0, autoAlpha: 1, duration: 0.34, ease: 'power3.out' });
                    gsap.to(arrow, { x: 0, y: 0, scale: 1, duration: 0.34, ease: 'power3.out' });
                });
            });
        }

        function start() {
            initThemeToggle();
            initSmoothScroll();
            initMobileMenu();
            initBackToTop();
            initScrollProgress();
            initCustomCursor();
            initContactForm();
            initSliders();
            initLightbox();
            initPageTransitions();
            initSelectedWorkHover();

            runLoader(() => {
                runIntro();
                initScrollReveals();
            });
        }

        ready(start);
    })();

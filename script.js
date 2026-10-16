document.documentElement.classList.add('js');

(() => {
  'use strict';

  const WHATSAPP_NUMBER = '254723732152';
  const SLIDE_INTERVAL = 2000;
  const REVIEW_INTERVAL = 5000;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Build every WhatsApp link from a message so quote requests arrive with context.
  document.querySelectorAll('[data-whatsapp]').forEach((link) => {
    const message = link.dataset.message || 'Hello Stelchar Aluminium, I would like to make an enquiry.';
    link.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  });

  // Keep the copyright year current.
  const currentYear = document.getElementById('current-year');
  if (currentYear) currentYear.textContent = new Date().getFullYear();

  // Scroll progress bar.
  const progressFill = document.getElementById('scroll-progress-fill');
  let scrollTicking = false;
  const updateScrollProgress = () => {
    if (!progressFill) return;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    progressFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    scrollTicking = false;
  };
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      window.requestAnimationFrame(updateScrollProgress);
      scrollTicking = true;
    }
  }, { passive: true });
  updateScrollProgress();

  // Mobile navigation.
  const menuToggle = document.querySelector('.menu-toggle');
  const primaryNav = document.getElementById('primary-nav');
  const closeMenu = () => {
    if (!menuToggle || !primaryNav) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation');
    primaryNav.classList.remove('is-open');
  };
  if (menuToggle && primaryNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', String(!isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Open navigation' : 'Close navigation');
      primaryNav.classList.toggle('is-open', !isOpen);
    });
    primaryNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
    document.addEventListener('click', (event) => {
      if (!primaryNav.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth > 850) closeMenu();
    });
  }

  // Animate sections into view without hiding content when JavaScript is unavailable.
  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -28px 0px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  // Mark the navigation item for the section currently in view.
  const navLinks = [...document.querySelectorAll('.nav-link')];
  const navTargets = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);
  if ('IntersectionObserver' in window && navTargets.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle('is-current', link.getAttribute('href') === `#${entry.target.id}`);
        });
      });
    }, { rootMargin: '-34% 0px -57% 0px', threshold: 0 });
    navTargets.forEach((section) => sectionObserver.observe(section));
  }

  // Gallery filters: tags can overlap, so a project may appear in several categories.
  const filterButtons = [...document.querySelectorAll('[data-filter]')];
  const projectCards = [...document.querySelectorAll('.project-card')];
  const filterCount = document.getElementById('filter-count');
  filterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const selectedFilter = button.dataset.filter;
      filterButtons.forEach((item) => {
        const selected = item === button;
        item.classList.toggle('is-selected', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      let visibleCount = 0;
      projectCards.forEach((card) => {
        const tags = (card.dataset.tags || '').split(/\s+/);
        const shouldShow = selectedFilter === 'all' || tags.includes(selectedFilter);
        card.hidden = !shouldShow;
        if (shouldShow) visibleCount += 1;
      });
      if (filterCount) filterCount.textContent = `${String(visibleCount).padStart(2, '0')} ${visibleCount === 1 ? 'solution' : 'solutions'}`;
    });
  });

  // Hero project spotlight: advances every two seconds, with manual controls.
  const slides = [...document.querySelectorAll('.spotlight-slide')];
  const slideCount = document.getElementById('slide-count');
  const slideProgress = document.getElementById('slide-progress-fill');
  const previousSlide = document.getElementById('slide-prev');
  const nextSlide = document.getElementById('slide-next');
  let currentSlide = 0;
  let slideTimer = null;
  let progressFrame = null;

  const startSlideProgress = () => {
    if (!slideProgress) return;
    if (progressFrame) window.cancelAnimationFrame(progressFrame);
    slideProgress.style.transition = 'none';
    slideProgress.style.width = '0%';
    // Force a style flush so each slide receives a fresh two-second progress animation.
    void slideProgress.offsetWidth;
    progressFrame = window.requestAnimationFrame(() => {
      slideProgress.style.transition = `width ${SLIDE_INTERVAL}ms linear`;
      slideProgress.style.width = '100%';
    });
  };

  const showSlide = (index) => {
    if (!slides.length) return;
    currentSlide = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === currentSlide;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });
    if (slideCount) {
      const label = `${String(currentSlide + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
      slideCount.innerHTML = `${label.split(' / ')[0]} <i>/</i> ${label.split(' / ')[1]}`;
      slideCount.setAttribute('aria-label', `Slide ${currentSlide + 1} of ${slides.length}`);
    }
    startSlideProgress();
  };

  const startSlideTimer = () => {
    window.clearInterval(slideTimer);
    if (slides.length > 1 && !reduceMotion.matches && !document.hidden) {
      slideTimer = window.setInterval(() => showSlide(currentSlide + 1), SLIDE_INTERVAL);
    }
  };

  if (slides.length) {
    showSlide(0);
    startSlideTimer();
    previousSlide?.addEventListener('click', () => {
      showSlide(currentSlide - 1);
      startSlideTimer();
    });
    nextSlide?.addEventListener('click', () => {
      showSlide(currentSlide + 1);
      startSlideTimer();
    });
    document.addEventListener('visibilitychange', startSlideTimer);
    reduceMotion.addEventListener?.('change', startSlideTimer);
  }

  // Add only reviews supplied from the real Google Business Profile or with the client's approval.
  // Shape: { text: 'Original review text', author: 'Public reviewer name', detail: 'Google · month year' }
  // The carousel supports up to 50 reviews, displays three at a time, and advances every five seconds.
  const verifiedGoogleReviews = [];
  const reviewCarousel = document.getElementById('review-carousel');
  const reviewPanelFoot = document.querySelector('.review-panel-foot');
  let reviewStart = 0;
  let reviewTimer = null;

  const renderReviews = () => {
    if (!reviewCarousel || !verifiedGoogleReviews.length) return;
    const groupSize = Math.min(3, verifiedGoogleReviews.length);
    const group = Array.from({ length: groupSize }, (_, offset) => verifiedGoogleReviews[(reviewStart + offset) % verifiedGoogleReviews.length]);
    reviewCarousel.innerHTML = `<div class="review-grid">${group.map((review) => `
      <article class="review-card">
        <div class="review-card-source">GOOGLE REVIEW</div>
        <p class="review-card-quote">“${escapeHtml(review.text)}”</p>
        <div class="review-card-meta"><span class="review-card-avatar" aria-hidden="true">${escapeHtml((review.author || 'C').trim().charAt(0).toUpperCase())}</span><span><strong>${escapeHtml(review.author || 'Google reviewer')}</strong><small>${escapeHtml(review.detail || 'Google review')}</small></span><span class="review-verified" title="Source review supplied for verification" aria-label="Source review supplied">✓</span></div>
      </article>`).join('')}</div>`;
    if (reviewPanelFoot) reviewPanelFoot.innerHTML = `<span>Showing ${groupSize} of ${verifiedGoogleReviews.length} supplied reviews</span><span class="review-stars">GOOGLE · SOURCE ADDED</span>`;
  };

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);

  if (verifiedGoogleReviews.length) {
    renderReviews();
    reviewTimer = window.setInterval(() => {
      reviewStart = (reviewStart + 3) % verifiedGoogleReviews.length;
      renderReviews();
    }, REVIEW_INTERVAL);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) window.clearInterval(reviewTimer);
      else if (verifiedGoogleReviews.length > 3) {
        window.clearInterval(reviewTimer);
        reviewTimer = window.setInterval(() => {
          reviewStart = (reviewStart + 3) % verifiedGoogleReviews.length;
          renderReviews();
        }, REVIEW_INTERVAL);
      }
    });
  }

  // A contact form that prepares the enquiry in WhatsApp (no server or stored form data).
  const quoteForm = document.getElementById('quote-form');
  const formNote = document.getElementById('form-note');
  quoteForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!quoteForm.reportValidity()) return;
    const formData = new FormData(quoteForm);
    const name = String(formData.get('name') || '').trim();
    const phone = String(formData.get('phone') || '').trim();
    const service = String(formData.get('service') || '').trim();
    const details = String(formData.get('details') || '').trim();
    const message = [
      'Hello Stelchar Aluminium, I would like to request a quote.',
      `Name: ${name}`,
      `My phone: ${phone}`,
      `Product: ${service}`,
      details ? `Project details: ${details}` : ''
    ].filter(Boolean).join('\n');
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    if (formNote) formNote.textContent = 'Your WhatsApp message is ready. Review it and tap send to contact Stelchar.';
    const whatsappLink = document.createElement('a');
    whatsappLink.href = url;
    whatsappLink.target = '_blank';
    whatsappLink.rel = 'noopener noreferrer';
    whatsappLink.hidden = true;
    document.body.appendChild(whatsappLink);
    whatsappLink.click();
    whatsappLink.remove();
  });
})();

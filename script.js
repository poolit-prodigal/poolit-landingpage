const SERVICES = {
  spotify: { name: 'Spotify Family', monthly: 2500, members: 6, color: '#1db954' },
  netflix: { name: 'Netflix Premium', monthly: 4800, members: 3, color: '#e50914' },
  youtube: { name: 'YouTube Premium', monthly: 2100, members: 5, color: '#ff0000' },
  amazon: { name: 'Amazon Prime', monthly: 3500, members: 3, color: '#00a8e1' }
};

const formatNaira = (value) =>
  new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0
  }).format(value);

function setupTheme() {
  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  const icon = document.getElementById('themeToggleIcon');
  const text = document.getElementById('themeToggleText');
  const storageKey = 'poolit-theme';

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const savedTheme = localStorage.getItem(storageKey);
  const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

  const applyTheme = (theme) => {
    root.setAttribute('data-theme', theme);
    if (icon && text) {
      icon.textContent = theme === 'dark' ? '☀️' : '🌙';
      text.textContent = theme === 'dark' ? 'Light' : 'Dark';
    }
  };

  applyTheme(initialTheme);

  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(storageKey, next);
    });
  }
}

async function updateWaitlistCount() {
  try {
    const response = await fetch('/api/count');
    if (!response.ok) throw new Error('Failed to fetch count');
    
    const data = await response.json();
    const count = data.count || 0;
    
    const emblemCount = document.getElementById('emblemCount');
    const proofText = document.getElementById('proofText');
    
    if (emblemCount) {
      const currentCount = parseInt(emblemCount.textContent);
      if (count !== currentCount) {
        emblemCount.textContent = count;
        // Animate number change
        emblemCount.style.animation = 'none';
        setTimeout(() => {
          emblemCount.style.animation = 'emblemCountPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        }, 10);
      }
    }
    
    if (proofText && count > 0) {
      if (count === 1) {
        proofText.textContent = 'one neighbour';
      } else if (count < 10) {
        proofText.textContent = `${count} neighbours`;
      } else if (count < 100) {
        proofText.textContent = 'dozens of neighbours';
      } else if (count < 1000) {
        proofText.textContent = 'hundreds of neighbours';
      } else {
        proofText.textContent = 'thousands of neighbours';
      }
    }
  } catch (error) {
    console.warn('Could not update waitlist count:', error.message);
  }
}

function resolveLaunchDate() {
  const fromMeta = document
    .querySelector('meta[name="poolit-launch-date"]')
    ?.getAttribute('content');
  return fromMeta || '2026-08-17T00:00:00Z';
}

function startCountdown() {
  const daysEl = document.getElementById('days');
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');
  const countdownEls = [daysEl, hoursEl, minutesEl, secondsEl];
  const launchDate = new Date(resolveLaunchDate()).getTime();

  const tick = () => {
    const now = Date.now();
    const diff = Math.max(launchDate - now, 0);

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    daysEl.textContent = String(days).padStart(2, '0');
    hoursEl.textContent = String(hours).padStart(2, '0');
    minutesEl.textContent = String(minutes).padStart(2, '0');
    secondsEl.textContent = String(seconds).padStart(2, '0');

    countdownEls.forEach((el) => {
      el.classList.remove('pulse');
      void el.offsetWidth;
      el.classList.add('pulse');
    });
  };

  tick();
  setInterval(tick, 1000);
}

function setupSavingsCalculator() {
  const select = document.getElementById('serviceSelect');
  const calcCard = document.querySelector('.calc-card');
  const output = document.getElementById('calcResult');
  const options = document.querySelectorAll('.calc-option');
  const fullCostEl = document.getElementById('calcFullCost');
  const splitCostEl = document.getElementById('calcSplitCost');
  const fullBar = document.getElementById('calcFullBar');
  const splitBar = document.getElementById('calcSplitBar');
  const saveChip = document.getElementById('calcSaveChip');

  options.forEach((btn) => {
    btn.addEventListener('click', () => {
      const value = btn.getAttribute('data-service') || '';
      select.value = value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  select.addEventListener('change', () => {
    const service = SERVICES[select.value];
    options.forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-service') === select.value);
    });

    if (!service) {
      if (calcCard) {
        calcCard.style.removeProperty('--calc-color');
      }
      output.textContent = 'Pick a service to see per-member cost and yearly savings.';
      output.classList.remove('animated');
      if (fullCostEl) {
        fullCostEl.textContent = '—';
      }
      if (splitCostEl) {
        splitCostEl.textContent = '—';
      }
      if (fullBar) {
        fullBar.style.width = '0%';
      }
      if (splitBar) {
        splitBar.style.width = '0%';
      }
      if (saveChip) {
        saveChip.textContent = 'Choose a service to reveal your savings.';
      }
      return;
    }

    if (calcCard) {
      calcCard.style.setProperty('--calc-color', service.color);
    }

    const perMember = Math.round(service.monthly / service.members);
    const annualFull = service.monthly * 12;
    const annualSplit = perMember * 12;
    const annualSaving = annualFull - annualSplit;
    const savePct = Math.round(((service.monthly - perMember) / service.monthly) * 100);

    output.innerHTML = `
      <strong>${service.name}</strong><br>
      Per-member monthly cost: <span class="calc-value">${formatNaira(perMember)}</span><br>
      Estimated annual saving: <span class="calc-value">${formatNaira(annualSaving)}</span>
    `;

    if (fullCostEl) {
      fullCostEl.textContent = formatNaira(service.monthly);
    }
    if (splitCostEl) {
      splitCostEl.textContent = formatNaira(perMember);
    }
    if (fullBar) {
      fullBar.style.width = '100%';
    }
    if (splitBar) {
      splitBar.style.width = `${Math.max(Math.round((perMember / service.monthly) * 100), 10)}%`;
    }
    if (saveChip) {
      saveChip.textContent = `You save about ${savePct}% every month with PoolIt.`;
    }

    output.classList.remove('animated');
    requestAnimationFrame(() => output.classList.add('animated'));

    if (typeof window.gsap !== 'undefined') {
      window.gsap.fromTo(
        '.calc-insights',
        { y: 10, opacity: 0.6 },
        { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }
      );
    }
  });
}

function captureReferral() {
  const ref = new URLSearchParams(window.location.search).get('ref');
  if (ref) {
    sessionStorage.setItem('referredBy', ref);
  }
}

async function populateSocialProof() {
  const socialProof = document.getElementById('socialProof');
  try {
    const response = await fetch('/api/count');
    if (!response.ok) {
      throw new Error('Failed to fetch count');
    }
    const { count } = await response.json();
    socialProof.textContent = `🏘️ ${Math.max(Number(count) || 0, 0)} neighbours already on the waitlist`;
  } catch {
    socialProof.textContent = '🏘️ hundreds of neighbours already on the waitlist';
  }
}

function setupScrollCta() {
  const btn = document.getElementById('heroCta');
  const target = document.getElementById('waitlist');
  btn.addEventListener('click', () => {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function setupForm() {
  const form = document.getElementById('waitlistForm');
  const submitBtn = document.getElementById('submitBtn');
  const errorEl = document.getElementById('formError');
  const successCard = document.getElementById('successCard');
  const refLink = document.getElementById('refLink');
  const copyRefBtn = document.getElementById('copyRefBtn');
  const copyStatus = document.getElementById('copyStatus');

  if (copyRefBtn && copyStatus && refLink) {
    copyRefBtn.addEventListener('click', async () => {
      const value = refLink.href;
      if (!value || value === '#') {
        return;
      }
      try {
        await navigator.clipboard.writeText(value);
        copyStatus.textContent = 'Copied!';
      } catch {
        copyStatus.textContent = 'Unable to copy. Tap and hold to copy the link.';
      }
    });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    errorEl.textContent = '';

    const formData = new FormData(form);
    const name = String(formData.get('name') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const phoneRaw = String(formData.get('phone') || '').trim();
    const phone = phoneRaw.length ? phoneRaw : null;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!name || !emailRegex.test(email)) {
      errorEl.textContent = 'Please enter a valid name and email address.';
      return;
    }

    submitBtn.disabled = true;
    const defaultLabel = submitBtn.textContent;
    submitBtn.textContent = 'Joining...';

    try {
      const payload = {
        name,
        email,
        phone,
        referredBy: sessionStorage.getItem('referredBy') || null
      };

      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Signup failed. Please try again.');
      }

      const body = await response.json();
      const code = body.ref_code;
      const referralUrl = `${window.location.origin}?ref=${encodeURIComponent(code)}`;

      form.classList.add('hidden');
      successCard.classList.remove('hidden');
      refLink.href = referralUrl;
      refLink.textContent = referralUrl;
      if (copyStatus) {
        copyStatus.textContent = '';
      }
      
      // Update count immediately after successful signup
      updateWaitlistCount();
    } catch (error) {
      if (!navigator.onLine) {
        errorEl.textContent = 'Check your connection and try again.';
      } else {
        errorEl.textContent = error.message || 'Something went wrong. Please try again.';
      }
      submitBtn.disabled = false;
      submitBtn.textContent = defaultLabel;
    }
  });
}

function setupRevealAnimations() {
  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) {
    return;
  }

  const hasGsap = typeof window.gsap !== 'undefined';

  const observer = new IntersectionObserver(
    (entries, io) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (hasGsap) {
            window.gsap.fromTo(
              entry.target,
              { y: 28, opacity: 0 },
              { y: 0, opacity: 1, duration: 0.85, ease: 'power3.out' }
            );
          } else {
            entry.target.classList.add('visible');
          }
          io.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: '0px 0px -5% 0px'
    }
  );

  targets.forEach((target) => observer.observe(target));
}

function setupGsapIntro() {
  if (typeof window.gsap === 'undefined') {
    return;
  }

  const timeline = window.gsap.timeline({ defaults: { ease: 'power3.out' } });
  timeline
    .from('.logo', { y: 20, opacity: 0, duration: 0.5 })
    .from('h1', { y: 24, opacity: 0, duration: 0.65 }, '-=0.2')
    .from('.hero-copy', { y: 20, opacity: 0, duration: 0.55 }, '-=0.35')
    .from('.hero-btn', { y: 16, opacity: 0, duration: 0.45 }, '-=0.3')
    .from('.count-card', { y: 18, opacity: 0, duration: 0.55, stagger: 0.08 }, '-=0.35');
}

function setupGsapIntro() {
  if (typeof window.gsap === 'undefined') {
    return;
  }

  const timeline = window.gsap.timeline({ defaults: { ease: 'power3.out' } });
  timeline
    .from('.logo', { y: 20, opacity: 0, duration: 0.5 })
    .from('h1', { y: 24, opacity: 0, duration: 0.65 }, '-=0.2')
    .from('.hero-copy', { y: 20, opacity: 0, duration: 0.55 }, '-=0.35')
    .from('.hero-btn', { y: 16, opacity: 0, duration: 0.45 }, '-=0.3')
    .from('.count-card', { y: 18, opacity: 0, duration: 0.55, stagger: 0.08 }, '-=0.35');
}

setupTheme();
captureReferral();
startCountdown();
setupSavingsCalculator();
setupScrollCta();
setupForm();
populateSocialProof();
setupRevealAnimations();

// Fetch and update waitlist count immediately, then every 5 seconds
updateWaitlistCount();
setInterval(updateWaitlistCount, 5000);

setupGsapIntro();

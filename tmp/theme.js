document.addEventListener('DOMContentLoaded', function () {
  const body = document.body;
  const toggle = document.querySelector('.theme-toggle');
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const mobilePanel = document.getElementById('mobile-menu');
  const saved = localStorage.getItem('llpt-theme');

  if (saved === 'dark') {
    body.classList.add('theme-dark');
  }

  if (toggle) {
    toggle.addEventListener('click', function () {
      body.classList.toggle('theme-dark');
      localStorage.setItem('llpt-theme', body.classList.contains('theme-dark') ? 'dark' : 'light');
    });
  }

  if (mobileToggle && mobilePanel) {
    mobileToggle.addEventListener('click', function () {
      const open = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', String(!open));
      mobilePanel.hidden = open;
      body.classList.toggle('mobile-menu-open', !open);
    });

    mobilePanel.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobilePanel.hidden = true;
        body.classList.remove('mobile-menu-open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  document.querySelectorAll('.ticket-form input[maxlength="1"]').forEach(function(input, index, all) {
    input.addEventListener('input', function() {
      this.value = this.value.replace(/\D/g, '').slice(0, 1);
      if (this.value && all[index + 1]) all[index + 1].focus();
    });
    input.addEventListener('keydown', function(e) {
      if (e.key === 'Backspace' && !this.value && all[index - 1]) all[index - 1].focus();
    });
  });

  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
  document.querySelectorAll('.mobile-bottom-nav a').forEach(function(link) {
    const linkPath = new URL(link.href, window.location.origin).pathname.replace(/\/$/, '') || '/';
    if (linkPath === currentPath) {
      link.setAttribute('aria-current', 'page');
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.btn, .nav-link, .sidebar-link').forEach((item) => {
    item.addEventListener('touchstart', () => {}, { passive: true });
  });
});

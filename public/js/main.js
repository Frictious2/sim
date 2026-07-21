document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.btn, .nav-link, .sidebar-link').forEach((item) => {
    item.addEventListener('touchstart', () => {}, { passive: true });
  });

  const donationAmountInput = document.querySelector('input[name="amount"]');
  if (donationAmountInput) {
    document.querySelectorAll('[data-donation-amount]').forEach((button) => {
      button.addEventListener('click', () => {
        donationAmountInput.value = button.getAttribute('data-donation-amount') || '';
        donationAmountInput.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
  }
});

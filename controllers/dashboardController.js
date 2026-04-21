const content = require('../data/site-content');

function render(res, view, options = {}) {
  return res.render(view, {
    layout: 'layouts/dashboard',
    section: 'dashboard',
    ...options,
    content
  });
}

exports.index = (req, res) => render(res, 'dashboard/index', { title: 'Supporter Dashboard' });
exports.profile = (req, res) => render(res, 'dashboard/profile', { title: 'Profile' });
exports.donations = (req, res) => render(res, 'dashboard/donations', { title: 'Donation History' });
exports.sponsorships = (req, res) => render(res, 'dashboard/sponsorships', { title: 'Sponsorship History' });

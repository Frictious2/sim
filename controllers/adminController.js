const content = require('../data/site-content');

function render(res, view, options = {}) {
  return res.render(view, {
    layout: 'layouts/admin',
    section: 'admin',
    ...options,
    content
  });
}

exports.index = (req, res) => render(res, 'admin/index', { title: 'Admin Overview' });
exports.users = (req, res) => render(res, 'admin/users', { title: 'Manage Users' });
exports.blogPosts = (req, res) => render(res, 'admin/blog-posts', { title: 'Manage Blog Posts' });
exports.projects = (req, res) => render(res, 'admin/projects', { title: 'Manage Projects' });
exports.donations = (req, res) => render(res, 'admin/donations', { title: 'Manage Donations' });
exports.sponsorships = (req, res) => render(res, 'admin/sponsorships', { title: 'Manage Sponsorships' });
exports.volunteers = (req, res) => render(res, 'admin/volunteers', { title: 'Manage Volunteer Applications' });
exports.messages = (req, res) => render(res, 'admin/messages', { title: 'Manage Messages' });

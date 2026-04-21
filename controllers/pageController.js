const content = require('../data/site-content');

function render(res, view, options = {}) {
  return res.render(view, {
    ...options,
    content
  });
}

exports.home = (req, res) => render(res, 'pages/home', { title: 'Home' });
exports.about = (req, res) => render(res, 'pages/about', { title: 'About' });
exports.mission = (req, res) => render(res, 'pages/mission', { title: 'Mission' });
exports.missionFields = (req, res) => render(res, 'pages/mission-fields', { title: 'Mission Fields' });
exports.projects = (req, res) => render(res, 'pages/projects', { title: 'Projects' });
exports.sponsor = (req, res) => render(res, 'pages/sponsor', { title: 'Sponsor' });
exports.blog = (req, res) => render(res, 'pages/blog', { title: 'Blog' });
exports.stories = (req, res) => render(res, 'pages/stories', { title: 'Stories' });
exports.gallery = (req, res) => render(res, 'pages/gallery', { title: 'Gallery' });
exports.contact = (req, res) => render(res, 'pages/contact', { title: 'Contact' });
exports.donate = (req, res) => render(res, 'pages/donate', { title: 'Donate' });

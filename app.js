const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const helmet = require('helmet');
const morgan = require('morgan');

const webRoutes = require('./routes/webRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const siteContent = require('./data/site-content');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.locals.site = siteContent;
  res.locals.currentPath = req.originalUrl.split('?')[0];
  res.locals.demoAlert = req.query.demo || '';
  next();
});

app.use('/', webRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).render('errors/404', {
    title: 'Page Not Found'
  });
});

module.exports = app;

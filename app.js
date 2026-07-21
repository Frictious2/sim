const path = require('path');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('connect-flash');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const webRoutes = require('./routes/webRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const siteContent = require('./data/site-content');
const { attachUserToLocals } = require('./middleware/authMiddleware');
const { formatDate, formatDateTime, truncateText } = require('./utils/formatting');
const { buildQueryString } = require('./utils/pagination');
const { getPublicSiteContext } = require('./services/siteSettingsService');

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
app.use(session({
  name: env.session.cookieName,
  secret: env.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.session.cookieSecure,
    maxAge: env.session.maxAgeMs
  }
}));
app.use(flash());

app.use(async (req, res, next) => {
  res.locals.site = await getPublicSiteContext().catch(() => siteContent);
  res.locals.currentPath = req.originalUrl.split('?')[0];
  res.locals.demoAlert = req.query.demo || '';
  res.locals.helpers = {
    formatDate,
    formatDateTime,
    truncateText,
    buildQueryString
  };
  res.locals.pageTitle = '';
  res.locals.metaDescription = res.locals.site.defaultMetaDescription;
  res.locals.ogTitle = '';
  res.locals.ogDescription = res.locals.site.defaultMetaDescription;
  res.locals.ogImage = '';
  next();
});
app.use(attachUserToLocals);

app.use('/', authRoutes);
app.use('/', webRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).render('errors/404', {
    title: 'Page Not Found'
  });
});

module.exports = app;

function attachUserToLocals(req, res, next) {
  res.locals.currentUser = req.session && req.session.user ? req.session.user : null;
  res.locals.isAuthenticated = Boolean(res.locals.currentUser);
  res.locals.flashMessages = {
    success: req.flash ? req.flash('success') : [],
    error: req.flash ? req.flash('error') : [],
    info: req.flash ? req.flash('info') : []
  };

  const rawFormData = req.flash ? req.flash('formData') : [];
  if (rawFormData.length > 0) {
    try {
      res.locals.formData = JSON.parse(rawFormData[0]);
    } catch (error) {
      res.locals.formData = {};
    }
  } else {
    res.locals.formData = {};
  }

  next();
}

function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }

  req.flash('error', 'Please log in to continue.');
  return res.redirect('/login');
}

function requireGuest(req, res, next) {
  if (!req.session || !req.session.user) {
    return next();
  }

  if (req.session.user.role === 'admin') {
    return res.redirect('/admin');
  }

  return res.redirect('/dashboard');
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      req.flash('error', 'Please log in to continue.');

      if (allowedRoles.includes('admin')) {
        req.flash('info', 'If no admin account exists yet, import the schema and run node scripts/seed-admin.js.');
      }

      return res.redirect('/login');
    }

    if (!allowedRoles.includes(req.session.user.role)) {
      req.flash('error', 'You do not have permission to access that area.');
      return res.redirect('/dashboard');
    }

    return next();
  };
}

const requireAdmin = requireRole('admin');

module.exports = {
  attachUserToLocals,
  requireAuth,
  requireGuest,
  requireRole,
  requireAdmin
};

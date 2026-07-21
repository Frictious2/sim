const authService = require('../services/authService');
const env = require('../config/env');

function persistSessionUser(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((regenerateError) => {
      if (regenerateError) {
        reject(regenerateError);
        return;
      }

      req.session.user = buildSessionUser(user);
      req.session.save((saveError) => {
        if (saveError) {
          reject(saveError);
          return;
        }

        resolve();
      });
    });
  });
}

function sanitizeFormData(formData = {}) {
  return {
    name: formData.name || '',
    email: formData.email || '',
    phone: formData.phone || ''
  };
}

function buildSessionUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

async function showLogin(req, res) {
  let adminSeedHint = false;

  try {
    adminSeedHint = !(await authService.hasAnyAdmin());
  } catch (error) {
    adminSeedHint = false;
  }

  return res.render('auth/login', {
    title: 'Login',
    content: require('../data/site-content'),
    adminSeedHint
  });
}

function showRegister(req, res) {
  return res.render('auth/register', {
    title: 'Register',
    content: require('../data/site-content')
  });
}

async function register(req, res) {
  const { name = '', email = '', phone = '', password = '', confirmPassword = '' } = req.body;
  const formData = sanitizeFormData({ name, email, phone });

  if (!name.trim() || !email.trim() || !password || !confirmPassword) {
    req.flash('error', 'Please complete all required registration fields.');
    req.flash('formData', JSON.stringify(formData));
    return res.redirect('/register');
  }

  if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
    req.flash('error', 'Please enter a valid email address.');
    req.flash('formData', JSON.stringify(formData));
    return res.redirect('/register');
  }

  if (phone.trim() && !/^[+()\-\s\d]{7,20}$/.test(phone.trim())) {
    req.flash('error', 'Please enter a valid phone number or leave the phone field blank.');
    req.flash('formData', JSON.stringify(formData));
    return res.redirect('/register');
  }

  if (password.length < 8) {
    req.flash('error', 'Password must be at least 8 characters long.');
    req.flash('formData', JSON.stringify(formData));
    return res.redirect('/register');
  }

  if (password !== confirmPassword) {
    req.flash('error', 'Password confirmation does not match.');
    req.flash('formData', JSON.stringify(formData));
    return res.redirect('/register');
  }

  try {
    const User = require('../models/User');
    const emailTaken = await User.emailExists(email);

    if (emailTaken) {
      req.flash('error', 'An account already exists for that email address.');
      req.flash('formData', JSON.stringify(formData));
      return res.redirect('/register');
    }

    const user = await authService.registerUser({ name, email, phone, password });
    await persistSessionUser(req, user);
    req.flash('success', 'Your account has been created successfully.');
    return res.redirect('/dashboard');
  } catch (error) {
    req.flash('error', `Registration could not be completed. ${error.message}`);
    req.flash('formData', JSON.stringify(formData));
    return res.redirect('/register');
  }
}

async function login(req, res) {
  const { email = '', password = '' } = req.body;
  const formData = sanitizeFormData({ email });

  if (!email.trim() || !password) {
    req.flash('error', 'Please enter both your email address and password.');
    req.flash('formData', JSON.stringify(formData));
    return res.redirect('/login');
  }

  if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
    req.flash('error', 'Please enter a valid email address.');
    req.flash('formData', JSON.stringify(formData));
    return res.redirect('/login');
  }

  try {
    const { user, reason } = await authService.authenticateUser({ email, password });

    if (!user) {
      req.flash('error', reason);
      req.flash('formData', JSON.stringify(formData));
      return res.redirect('/login');
    }

    await persistSessionUser(req, user);
    req.flash('success', `Welcome back, ${user.name}.`);
    return res.redirect(user.role === 'admin' ? '/admin' : '/dashboard');
  } catch (error) {
    req.flash('error', `Login failed. ${error.message}`);
    req.flash('formData', JSON.stringify(formData));
    return res.redirect('/login');
  }
}

function logout(req, res) {
  req.session.destroy((error) => {
    if (error) {
      return res.redirect('/');
    }

    res.clearCookie(env.session.cookieName);
    return res.redirect('/login');
  });
}

module.exports = {
  showLogin,
  showRegister,
  register,
  login,
  logout
};

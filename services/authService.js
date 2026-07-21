const User = require('../models/User');

async function registerUser({ name, email, phone, password }) {
  return User.createUser({
    name,
    email,
    phone,
    password,
    role: 'user',
    status: 'active'
  });
}

async function authenticateUser({ email, password }) {
  const user = await User.findByEmail(email);

  if (!user) {
    return { user: null, reason: 'User account was not found.' };
  }

  if (user.status !== 'active') {
    return { user: null, reason: 'This account is not active. Please contact the ministry administrator.' };
  }

  const validPassword = await User.verifyPassword(user, password);

  if (!validPassword) {
    return { user: null, reason: 'The email or password you entered is incorrect.' };
  }

  await User.updateLastLogin(user.id);
  const refreshedUser = await User.findById(user.id);

  return { user: refreshedUser, reason: null };
}

async function hasAnyAdmin() {
  return (await User.countAdmins()) > 0;
}

module.exports = {
  registerUser,
  authenticateUser,
  hasAnyAdmin
};

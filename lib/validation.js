// Validasi email
export function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

// Validasi password (minimal 6 karakter)
export function validatePassword(password) {
  return password.length >= 6;
}
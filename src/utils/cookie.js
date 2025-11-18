/**
 * Get a cookie value by name
 */
export function getCookie(name) {
  if (typeof document === 'undefined') return null;
  
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

/**
 * Set a cookie with subdomain support
 */
export function setCookie(name, value, days = 7, domain) {
  if (typeof document === 'undefined') return;
  
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  
  // Set cookie for subdomain (e.g., .pinksurfing.com)
  const domainString = domain ? `; domain=${domain}` : '';
  document.cookie = name + "=" + (value || "") + expires + "; path=/" + domainString;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name, domain) {
  if (typeof document === 'undefined') return;
  
  const domainString = domain ? `; domain=${domain}` : '';
  document.cookie = name + "=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC" + domainString;
}

/**
 * Get all auth-related cookies
 */
export function getAuthCookies() {
  return {
    access_token: getCookie('access_token'),
    refresh_token: getCookie('refresh_token'),
    user_id: getCookie('user_id'),
  };
}

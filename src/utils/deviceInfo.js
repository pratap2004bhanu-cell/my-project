export const getDeviceName = () => {
  const ua = navigator.userAgent || '';
  const isMac = /Macintosh|Mac OS X/.test(ua);
  const isWin = /Windows/.test(ua);
  const isLinux = /Linux/.test(ua);
  const isPhone = /iPhone|Android.*Mobile/.test(ua);
  const isTablet = /iPad|Android(?!.*Mobile)/.test(ua);

  let os = 'Unknown OS';
  if (isPhone) os = isMac ? 'iPhone' : 'Android Phone';
  else if (isTablet) os = 'Tablet';
  else if (isMac) os = 'macOS';
  else if (isWin) os = 'Windows';
  else if (isLinux) os = 'Linux';

  const isChrome = /Chrome\//.test(ua) && !/Edg\//.test(ua);
  const isSafari = /Safari\//.test(ua) && !/Chrome\//.test(ua);
  const isFirefox = /Firefox\//.test(ua);
  const isEdge = /Edg\//.test(ua);
  let browser = 'Browser';
  if (isChrome) browser = 'Chrome';
  else if (isSafari) browser = 'Safari';
  else if (isFirefox) browser = 'Firefox';
  else if (isEdge) browser = 'Edge';

  return `${os} · ${browser}`;
};
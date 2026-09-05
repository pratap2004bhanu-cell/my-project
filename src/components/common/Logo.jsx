const Logo = ({ size = 40, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Let's Go"
  >
    <defs>
      <linearGradient id="letsgo-brand" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#a3e635" />
        <stop offset="0.55" stopColor="#6366f1" />
        <stop offset="1" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    <rect width="40" height="40" rx="11" fill="url(#letsgo-brand)" />
    <circle cx="11.4" cy="11.6" r="1.1" fill="#ffffff" opacity="0.85" />
    <path
      d="M20 7.8c-5.7 0-9.7 4.3-9.7 9.6 0 7.1 8.9 13.6 9.4 13.9a1 1 0 0 0 1.2 0c.5-.3 9.4-6.8 9.4-13.9 0-5.3-4-9.6-9.7-9.6z"
      fill="#ffffff"
    />
    <path
      d="M31.5 6.5 l1.1 2.7 2.7 1.1 -2.7 1.1 -1.1 2.7 -1.1 -2.7 -2.7 -1.1 2.7 -1.1 z"
      fill="#ffffff"
    />
    <circle cx="16.9" cy="16.6" r="1.9" fill="#0b0e14" />
    <circle cx="23.1" cy="16.6" r="1.9" fill="#0b0e14" />
    <circle cx="17.5" cy="16" r="0.65" fill="#ffffff" />
    <circle cx="23.7" cy="16" r="0.65" fill="#ffffff" />
    <path d="M17.4 20 c0 1.7 1.1 2.8 2.6 2.8 s2.6 -1.1 2.6 -2.8" stroke="#0b0e14" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

export default Logo;
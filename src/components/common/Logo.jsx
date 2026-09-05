const Logo = ({ size = 40, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Hanglly"
  >
    <defs>
      <linearGradient id="hanglly-brand" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#a3e635" />
        <stop offset="0.55" stopColor="#6366f1" />
        <stop offset="1" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    <rect width="40" height="40" rx="11" fill="url(#hanglly-brand)" />
    <circle cx="11.4" cy="11.6" r="1.1" fill="#ffffff" opacity="0.85" />
    <circle cx="12.9" cy="10.4" r="3" fill="#ffffff" />
    <circle cx="27.1" cy="10.4" r="3" fill="#ffffff" />
    <rect x="10.6" y="14.6" width="4.6" height="15.4" rx="2.3" fill="#ffffff" />
    <rect x="24.8" y="14.6" width="4.6" height="15.4" rx="2.3" fill="#ffffff" />
    <rect x="14.6" y="19.8" width="10.8" height="5.2" rx="2.6" fill="#ffffff" />
  </svg>
);

export default Logo;
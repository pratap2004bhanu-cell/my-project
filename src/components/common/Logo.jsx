const Logo = ({ size = 40, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 40 40"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="KIKY"
  >
    <defs>
      <linearGradient id="kiky-brand" x1="5" y1="1" x2="38" y2="40" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#84cc16" />
        <stop offset="0.2" stopColor="#a3e635" />
        <stop offset="0.55" stopColor="#6366f1" />
        <stop offset="0.85" stopColor="#c026d3" />
        <stop offset="1" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    <rect width="40" height="40" rx="11" fill="url(#kiky-brand)" />
    <circle cx="8" cy="8" r="12" fill="#ffffff" opacity="0.06" />
    <circle cx="34" cy="34" r="14" fill="#ffffff" opacity="0.08" />
    <rect x="9.2" y="9.2" width="5.6" height="21.6" rx="2.8" fill="#ffffff" />
    <path
      d="M13.9 17.9 C20.4 13.5 26.2 10.2 30.7 8.9"
      stroke="#ffffff"
      strokeWidth="5.6"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M13.9 24.1 C20.4 28.5 26.2 31.8 30.7 33.1"
      stroke="#ffffff"
      strokeWidth="5.6"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="33.8" cy="9.5" r="1.35" fill="#ffffff" opacity="0.85" />
    <circle cx="33.8" cy="32.5" r="1.35" fill="#ffffff" opacity="0.85" />
  </svg>
);

export default Logo;
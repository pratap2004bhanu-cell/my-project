const Logo = ({
  size = 150,
  tagline = false,
  className = '',
}) => {
  const viewBox = tagline ? '0 0 300 100' : '0 0 300 88';

  return (
    <svg
      width={size}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="KIKY"
    >
      <defs>
        <linearGradient id="klogobrand" x1="30" y1="24" x2="130" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#22D3EE" />
          <stop offset="0.25" stopColor="#60A5FA" />
          <stop offset="0.5" stopColor="#C084FC" />
          <stop offset="0.7" stopColor="#F472B6" />
          <stop offset="0.88" stopColor="#FB923C" />
          <stop offset="1" stopColor="#FDE047" />
        </linearGradient>
      </defs>

      {/* Abstract K / two people connecting */}
      <g transform="translate(8 0)">
        <g stroke="url(#klogobrand)" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 34 74 L 34 42" strokeWidth="14" />
          <path d="M 38 50 C 52 42 64 36 78 32" strokeWidth="12" />
          <path d="M 38 58 C 56 68 68 72 82 74" strokeWidth="12" />
        </g>

        {/* Energy / connection element above the symbol */}
        <circle cx="36" cy="26" r="9" fill="#FDE047" />
        <circle cx="36" cy="26" r="4.5" fill="#FFFFFF" fillOpacity="0.4" />

        {/* Motion / spark lines */}
        <g stroke="#FDE047" strokeLinecap="round">
          <path d="M 100 24 L 112 19" strokeWidth="6" opacity="0.95" />
          <path d="M 108 40 L 124 36" strokeWidth="5" opacity="0.75" />
          <path d="M 102 52 L 112 50" strokeWidth="4" opacity="0.55" />
        </g>
      </g>

      {/* "kiky" wordmark — rounded vector strokes (matches app icon geometry) */}
      <g transform="translate(52 -176) scale(0.605)" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeWidth="20">
        <path d="M 166 400 L 166 334" />
        <path d="M 166 350 L 194 334" />
        <path d="M 166 358 L 200 400" />

        <path d="M 212 400 L 212 358" />

        <path d="M 238 400 L 238 334" />
        <path d="M 238 350 L 266 334" />
        <path d="M 238 358 L 272 400" />

        <path d="M 292 334 L 316 358" />
        <path d="M 346 334 L 316 358" />
        <path d="M 316 358 L 316 400" />
      </g>
      <circle cx="180" cy="26" r="4.8" fill="#FDE047" />

      {tagline && (
        <text
          x="150"
          y="94"
          textAnchor="middle"
          fontFamily='"Poppins", "Inter", sans-serif'
          fontWeight="500"
          fontSize="14"
          letterSpacing="3"
          fill="currentColor"
          opacity="0.6"
        >
          People • Plans • Play
        </text>
      )}
    </svg>
  );
};

export default Logo;
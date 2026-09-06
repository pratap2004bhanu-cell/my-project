const Logo = ({
  size = 150,
  tagline = false,
  className = '',
}) => {
  const viewBox = tagline ? '0 0 300 158' : '0 0 300 120';

  return (
    <svg
      width={size}
      height={size * (tagline ? 158 / 300 : 120 / 300)}
      viewBox={viewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="KIKY"
    >
      <defs>
        <linearGradient id="kiky-sun" x1="90" y1="0" x2="210" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FF5F6D" />
          <stop offset="1" stopColor="#FFAA24" />
        </linearGradient>
      </defs>

      {/* Circular sun accent peeking above the wordmark */}
      <path
        d="M 52 40 A 34 34 0 0 1 92 14"
        fill="none"
        stroke="#FFAA24"
        strokeWidth="8"
        strokeLinecap="round"
        opacity="0.95"
      />

      {/* Wordmark */}
      <text
        x="150"
        y="86"
        textAnchor="middle"
        fontFamily='"Baloo 2", "Fredoka", "Nunito", sans-serif'
        fontWeight="800"
        fontSize="70"
        letterSpacing="2"
        fill="currentColor"
      >
        KIKY
      </text>

      {/* Playful Y feet (two friends) */}
      <circle cx="212" cy="114" r="4.5" fill="url(#kiky-sun)" />
      <circle cx="228" cy="114" r="4.5" fill="url(#kiky-sun)" />

      {/* Smile */}
      <path
        d="M 92 100 Q 150 114 200 100"
        fill="none"
        stroke="url(#kiky-sun)"
        strokeWidth="7"
        strokeLinecap="round"
      />

      {/* Spark lines */}
      <path d="M 238 34 l 11 -10" stroke="#FFAA24" strokeWidth="6" strokeLinecap="round" />
      <path d="M 249 46 l 10 -9" stroke="#FFAA24" strokeWidth="6" strokeLinecap="round" opacity="0.7" />
      <path d="M 258 58 l 8 -7" stroke="#FFAA24" strokeWidth="5" strokeLinecap="round" opacity="0.5" />

      {tagline && (
        <text
          x="150"
          y="142"
          textAnchor="middle"
          fontFamily='"Poppins", "Inter", sans-serif'
          fontWeight="500"
          fontSize="22"
          letterSpacing="7"
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
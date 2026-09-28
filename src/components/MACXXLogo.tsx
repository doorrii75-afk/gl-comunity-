interface MACXXLogoProps {
  size?: number;
  className?: string;
}

export default function MACXXLogo({ size = 40, className = "" }: MACXXLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="macxx-grad" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <linearGradient id="macxx-grad-dark" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#0891b2" />
        </linearGradient>
      </defs>
      {/* Rounded square background */}
      <rect width="48" height="48" rx="12" fill="#0a0b0f" />
      <rect width="48" height="48" rx="12" fill="url(#macxx-grad)" fillOpacity="0.12" />
      <rect x="0.5" y="0.5" width="47" height="47" rx="11.5" stroke="url(#macxx-grad)" strokeOpacity="0.4" />
      {/* M letter */}
      <path
        d="M12 34V16L18 26L24 16V34"
        stroke="url(#macxx-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* XX letter */}
      <path
        d="M28 18L36 30M36 18L28 30"
        stroke="url(#macxx-grad)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Dot accent */}
      <circle cx="38" cy="34" r="2.5" fill="#06b6d4" />
    </svg>
  );
}

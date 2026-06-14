export function SevakLogo({ size = 34, variant = 'light' }: { size?: number; variant?: 'light' | 'dark' }) {
  const color = variant === 'light' ? '#FFFFFF' : '#003580';
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4 30c0-8.837 7.163-16 16-16s16 7.163 16 16"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      {/* center figure */}
      <circle cx="20" cy="14" r="3.4" fill={color} />
      <path d="M14 28c0-3.6 2.7-6.4 6-6.4s6 2.8 6 6.4" fill={color} />
      {/* left figure */}
      <circle cx="9" cy="20" r="2.6" fill={color} opacity="0.75" />
      <path d="M4.5 30.5c0-2.9 2-5.1 4.5-5.1s4.5 2.2 4.5 5.1" fill={color} opacity="0.75" />
      {/* right figure */}
      <circle cx="31" cy="20" r="2.6" fill={color} opacity="0.75" />
      <path d="M26.5 30.5c0-2.9 2-5.1 4.5-5.1s4.5 2.2 4.5 5.1" fill={color} opacity="0.75" />
    </svg>
  );
}

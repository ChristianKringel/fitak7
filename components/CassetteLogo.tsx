export function CassetteLogo({ className }: { className?: string }) {
  return (
    <svg width="34" height="24" viewBox="0 0 34 24" aria-hidden className={className}>
      <rect x="1" y="1" width="32" height="22" rx="4" fill="#FFD21F" stroke="#14120E" strokeWidth="2" />
      <rect x="6" y="6" width="22" height="9" rx="4.5" fill="#14120E" />
      <circle cx="11" cy="10.5" r="2.6" fill="#F4EAD5" />
      <circle cx="23" cy="10.5" r="2.6" fill="#F4EAD5" />
      <path d="M9 23l2-4h12l2 4" fill="none" stroke="#14120E" strokeWidth="2" />
    </svg>
  );
}

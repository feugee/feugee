export const QuoteIcon = ({
  className = "h-10 w-10 text-neutral-800",
}: {
  className?: string;
}) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
  </svg>
);

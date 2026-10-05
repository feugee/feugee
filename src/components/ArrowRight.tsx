export const ArrowRight = ({ size = "base" }: { size?: "base" | "lg" }) => (
  <svg
    aria-hidden="true"
    className={size === "lg" ? "h-8 w-8" : "h-4 w-4"}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      d="M5 12h14M13 6l6 6-6 6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

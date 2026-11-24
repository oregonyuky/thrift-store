import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

function I({ size = 18, children, ...rest }: P & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {children}
    </svg>
  );
}

export const GridIcon = (p: P) => (
  <I {...p}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="7" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="13" width="7" height="7" rx="1.5" />
  </I>
);
export const OrderIcon = (p: P) => (
  <I {...p}>
    <path d="M5 7h14l-1 12H6z" />
    <path d="M9 7a3 3 0 0 1 6 0" />
  </I>
);
export const BagIcon = (p: P) => (
  <I {...p}>
    <path d="M6.5 8.5h11l-.7 10.1a2 2 0 0 1-2 1.9H9.2a2 2 0 0 1-2-1.9L6.5 8.5Z" />
    <path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" />
  </I>
);
export const PeopleIcon = (p: P) => (
  <I {...p}>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M3 20c1-3.5 3.3-5 6-5s5 1.5 6 5" />
    <path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 15c1.6.6 2.6 2.2 3 5" />
  </I>
);
export const ChatIcon = (p: P) => (
  <I {...p}>
    <path d="M4 6h16v11H8l-4 3z" />
  </I>
);
export const ShirtIcon = (p: P) => (
  <I {...p}>
    <path d="M8 4 4 7l2 4 2-1v10h8V10l2 1 2-4-4-3c-.5 1.5-2 2.5-4 2.5S8.5 5.5 8 4Z" />
  </I>
);
export const TagIcon = (p: P) => (
  <I {...p}>
    <path d="M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v5H4zM13 14h7v5h-7z" />
  </I>
);
export const SparkIcon = (p: P) => (
  <I {...p}>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2 2M16 16l2 2M6 18l2-2M16 8l2-2" />
  </I>
);
export const BoxIcon = (p: P) => (
  <I {...p}>
    <path d="M3 8l9-4 9 4v9l-9 4-9-4z" />
    <path d="M3 8l9 4 9-4M12 12v9" />
  </I>
);
export const WindowIcon = (p: P) => (
  <I {...p}>
    <rect x="3" y="4" width="18" height="14" rx="2" />
    <path d="M3 9h18" />
  </I>
);
export const LockIcon = (p: P) => (
  <I {...p}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </I>
);
export const PlusIcon = (p: P) => (
  <I strokeWidth={2} {...p}>
    <path d="M12 5v14M5 12h14" />
  </I>
);
export const ChevronIcon = (p: P) => (
  <I strokeWidth={2} {...p}>
    <path d="m9 6 6 6-6 6" />
  </I>
);
export const ClockIcon = (p: P) => (
  <I {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l3 2" />
  </I>
);
export const ExternalIcon = (p: P) => (
  <I {...p}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </I>
);
export const CloseIcon = (p: P) => (
  <I {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </I>
);
export const EditIcon = (p: P) => (
  <I {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16z" />
  </I>
);
export const ImageIcon = (p: P) => (
  <I {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="9" cy="11" r="2" />
    <path d="m21 17-5-5-8 7" />
  </I>
);
export const MenuIcon = (p: P) => (
  <I {...p}>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </I>
);

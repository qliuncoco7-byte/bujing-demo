import type { ReactNode } from 'react'

type IconName =
  | 'play'
  | 'pause'
  | 'restart'
  | 'volume'
  | 'muted'
  | 'plus'
  | 'sparkles'
  | 'film'
  | 'undo'
  | 'close'
  | 'chevron-down'
  | 'pencil'
  | 'check'
  | 'info'
  | 'clock'
  | 'aspect'
  | 'refresh'
  | 'arrow-right'
  | 'wind'
  | 'alert'
  | 'leaf'
  | 'help'
  | 'expand'
  | 'bookmark'
  | 'spinner'
  | 'image'

const paths: Record<IconName, ReactNode> = {
  play: <path d="M8.5 5.6v12.8L18.8 12 8.5 5.6Z" fill="currentColor" stroke="none" />,
  pause: (
    <>
      <rect x="7.2" y="5.4" width="3.6" height="13.2" rx="1.2" fill="currentColor" stroke="none" />
      <rect x="13.2" y="5.4" width="3.6" height="13.2" rx="1.2" fill="currentColor" stroke="none" />
    </>
  ),
  restart: (
    <>
      <path d="M4.6 10.2A7.6 7.6 0 1 1 5.7 16" />
      <path d="M4.2 5.6v4.8h4.8" />
    </>
  ),
  volume: (
    <>
      <path d="M4.5 9.4h3.1L12.2 6v12l-4.6-3.4H4.5z" />
      <path d="M15.5 9a4.2 4.2 0 0 1 0 6" />
      <path d="M18 6.7a7.5 7.5 0 0 1 0 10.6" />
    </>
  ),
  muted: (
    <>
      <path d="M4.5 9.4h3.1L12.2 6v12l-4.6-3.4H4.5z" />
      <path d="m15.6 9.6 4.2 4.2M19.8 9.6l-4.2 4.2" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  sparkles: (
    <>
      <path d="M12 3.2 13.7 8l3.9 1.8-3.9 1.9L12 16.4l-1.7-4.7-3.9-1.9L10.3 8 12 3.2Z" />
      <path d="m18.5 14.5.9 2.2 2.1.9-2.1.9-.9 2.2-.9-2.2-2.1-.9 2.1-.9.9-2.2Z" />
      <path d="M5.4 15.2v3.2M3.8 16.8h3.2" />
    </>
  ),
  film: (
    <>
      <rect x="3.5" y="5.2" width="17" height="13.6" rx="2.1" />
      <path d="M7.2 5.4v13.2M16.8 5.4v13.2M3.7 9.5h3.4M3.7 14.4h3.4M16.9 9.5h3.4M16.9 14.4h3.4" />
    </>
  ),
  undo: (
    <>
      <path d="M8.7 7.2 5 10.9l3.7 3.7" />
      <path d="M5.3 10.9h8.3a5 5 0 0 1 0 10h-1.2" />
    </>
  ),
  close: <path d="m6 6 12 12M18 6 6 18" />,
  'chevron-down': <path d="m7 9.5 5 5 5-5" />,
  pencil: (
    <>
      <path d="M4.3 19.7l1-4.3L15.7 5a2.1 2.1 0 0 1 3 0l.3.3a2.1 2.1 0 0 1 0 3L8.6 18.7l-4.3 1Z" />
      <path d="m14.4 6.3 3.3 3.3" />
    </>
  ),
  check: <path d="m5 12.4 4.4 4.4L19.2 7" />,
  info: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 11v5.2M12 7.8h.01" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M12 6.8V12l3.4 2" />
    </>
  ),
  aspect: (
    <>
      <rect x="3.5" y="6" width="17" height="12" rx="2" />
      <path d="M8 6v12M16 6v12M3.7 10h4.1M16.2 10h4.1M3.7 14h4.1M16.2 14h4.1" />
    </>
  ),
  refresh: (
    <>
      <path d="M19.2 8.2A7.8 7.8 0 1 0 20 14" />
      <path d="M19.5 3.8v4.8h-4.8" />
    </>
  ),
  'arrow-right': <path d="M4.5 12h15M13.8 6.2 19.6 12l-5.8 5.8" />,
  wind: (
    <>
      <path d="M3.5 8.3h9.2a2.6 2.6 0 1 0-2.5-3.6" />
      <path d="M3.5 12h14.9a2.7 2.7 0 1 1-2.6 3.8" />
      <path d="M3.5 15.7h6.4" />
    </>
  ),
  alert: (
    <>
      <path d="M12 3.7 21 19.5H3L12 3.7Z" />
      <path d="M12 9v4.4M12 16.6h.01" />
    </>
  ),
  leaf: (
    <>
      <path d="M19.2 4.8C12 4.6 5.4 8.3 5.4 14a4.6 4.6 0 0 0 4.6 4.7c5.8 0 9.2-6.6 9.2-13.9Z" />
      <path d="M4.4 20c1.7-5.2 5.2-8.5 10.2-10.5" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="8.6" />
      <path d="M9.5 9.4a2.6 2.6 0 1 1 3.4 2.5c-.8.3-1 .9-1 1.7v.4M12 17.2h.01" />
    </>
  ),
  expand: (
    <>
      <path d="M4 9V4h5M20 15v5h-5M20 9V4h-5M4 15v5h5" />
    </>
  ),
  bookmark: <path d="M7 4.5h10v16l-5-3.3-5 3.3v-16Z" />,
  spinner: <path d="M21 12a9 9 0 1 1-6.2-8.6" />,
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.2" />
      <circle cx="9" cy="10" r="1.5" />
      <path d="m4.5 17.5 5-4.6 4 3.2 3-2.6 3 2.7" />
    </>
  ),
}

export function Icon({
  name,
  size = 18,
  className,
  strokeWidth = 1.8,
}: {
  name: IconName
  size?: number
  className?: string
  strokeWidth?: number
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

export type { IconName }

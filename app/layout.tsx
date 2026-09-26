import type { Metadata } from 'next';



export const metadata: Metadata = {
  title: { default: 'Northstar Training Portal', template: '%s · Northstar' },
  description: 'A controlled space to explore security. Authorised Northstar training environment.',
  robots: { index: false, follow: false }, icons: { icon: '/icon.svg' }
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><head><link rel="stylesheet" href="/portal.css"/></head><body>{children}</body></html>;
}

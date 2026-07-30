'use client';

import { usePathname } from 'next/navigation';
import NavBarWrapper from './NavBarWrapper';

/**
 * Client layout shell that hides the NavBar on the /login page.
 * The login page is a full-screen standalone experience.
 */
export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <>
      {!isLoginPage && <NavBarWrapper />}
      {children}
    </>
  );
}

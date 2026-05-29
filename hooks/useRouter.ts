import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Lightweight client-side router using the History API.
 * No dependencies required — uses pushState / popstate directly.
 *
 * Supports:
 *  - URL-based navigation (shareable links)
 *  - Browser back/forward buttons
 *  - Page refresh persistence
 *  - Programmatic navigation via `navigate()`
 *  - Dynamic sub-path matching (e.g. /works/foo → resolves to /works)
 *  - Query string and hash passthrough
 */

/** Top-level route segments the app recognises. */
export type RoutePath = '/' | '/works' | '/blogs' | '/docs';

/**
 * Map of known first-segment → RoutePath.
 * Any pathname whose first segment matches a key here will resolve to that route.
 * e.g. /works, /works/, /works/some-project  →  '/works'
 */
const ROUTE_MAP: Record<string, RoutePath> = {
  '': '/',           // root
  works: '/works',
  blogs: '/blogs',
  docs: '/docs',
};

/**
 * Resolve the current `location.pathname` to the best matching RoutePath.
 * Strips trailing slashes, extracts the first segment, and looks it up.
 * Unknown segments fall back to '/'.
 */
function resolveRoute(pathname: string = window.location.pathname): RoutePath {
  // Normalise: strip trailing slash (but keep leading)
  const normalised = pathname.replace(/\/+$/, '') || '/';
  // Extract the first segment: "/works/foo" → "works"
  const firstSegment = normalised.split('/')[1] ?? '';
  return ROUTE_MAP[firstSegment] ?? '/';
}

export function useRouter() {
  const [path, setPath] = useState<RoutePath>(() => resolveRoute());

  // Keep a ref so `navigate` never has a stale closure over `path`
  const pathRef = useRef(path);
  pathRef.current = path;

  // Listen for popstate (browser back / forward)
  useEffect(() => {
    const handlePopState = () => {
      setPath(resolveRoute());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Stable navigate — no dependency on `path` state thanks to the ref
  const navigate = useCallback((to: RoutePath) => {
    if (to === pathRef.current) return;
    window.history.pushState(null, '', to);
    setPath(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return { path, navigate };
}

/**
 * Helper: creates an onClick handler for <a> tags that prevents
 * full page reload while still using real <a href="..."> for SEO.
 *
 * Preserves native behaviour for modifier-key clicks (open in new tab).
 */
export function createLinkHandler(navigate: (to: RoutePath) => void, to: RoutePath) {
  return (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(to);
  };
}

import { useCallback, useEffect, useRef, useState } from 'react';

export function useMenuDayTabScrollFades(contentKey: unknown) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [tabsOverflow, setTabsOverflow] = useState(false);

  const updateScrollFades = useCallback(() => {
    const nav = tabsRef.current?.querySelector<HTMLElement>('.nav');
    if (!nav) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      setTabsOverflow(false);
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = nav;
    setTabsOverflow(scrollWidth > clientWidth + 2);
    setCanScrollLeft(scrollLeft > 2);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 2);
  }, []);

  useEffect(() => {
    const root = tabsRef.current;
    const nav = root?.querySelector<HTMLElement>('.nav');
    if (!nav) return undefined;

    let frameId = 0;
    let afterScrollFrameId = 0;

    nav.addEventListener('scroll', updateScrollFades, { passive: true });
    window.addEventListener('resize', updateScrollFades);

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(updateScrollFades)
      : null;
    resizeObserver?.observe(nav);

    frameId = requestAnimationFrame(() => {
      updateScrollFades();

      const activeTab = nav.querySelector<HTMLElement>('.nav-link.active');
      if (activeTab) {
        const navRect = nav.getBoundingClientRect();
        const tabRect = activeTab.getBoundingClientRect();
        const delta = (tabRect.left + tabRect.width / 2) - (navRect.left + navRect.width / 2);
        nav.scrollLeft += delta;
        afterScrollFrameId = requestAnimationFrame(updateScrollFades);
      }
    });

    return () => {
      cancelAnimationFrame(frameId);
      cancelAnimationFrame(afterScrollFrameId);
      nav.removeEventListener('scroll', updateScrollFades);
      window.removeEventListener('resize', updateScrollFades);
      resizeObserver?.disconnect();
    };
  }, [contentKey, updateScrollFades]);

  return { tabsRef, canScrollLeft, canScrollRight, tabsOverflow };
}

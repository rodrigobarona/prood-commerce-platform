'use client';

import { TOCPopover, type TOCPopoverProps } from 'fumadocs-ui/layouts/notebook/page/slots/toc';

/**
 * The popover draws its own `<header>`, which would be a second banner next to
 * the site header. Inside a `<nav>` it's only a header, and `contents` keeps it
 * a direct child of the page's grid. It's hidden where the side outline takes over.
 */
export function DocsTOCPopover(props: TOCPopoverProps) {
  return (
    <nav aria-label="On this page" className="contents xl:hidden">
      <TOCPopover {...props} />
    </nav>
  );
}

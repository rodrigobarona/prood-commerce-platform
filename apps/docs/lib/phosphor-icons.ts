import type { Icon } from '@phosphor-icons/react';
import {
  AppWindow,
  BookOpen,
  BracketsCurly,
  Code,
  CreditCard,
  Gauge,
  HardDrives,
  House,
  Package,
  PlugsConnected,
  RocketLaunch,
  Stack,
  Storefront,
} from '@phosphor-icons/react/dist/ssr';
import type { LoaderPlugin } from 'fumadocs-core/source';
import { createElement, type ReactNode } from 'react';

const icons = {
  AppWindow,
  BookOpen,
  BracketsCurly,
  Code,
  CreditCard,
  Gauge,
  HardDrives,
  House,
  Package,
  PlugsConnected,
  RocketLaunch,
  Stack,
  Storefront,
} satisfies Record<string, Icon>;

export type DocsIconName = keyof typeof icons;

function iconPlugin(resolveIcon: (icon?: string) => ReactNode): LoaderPlugin {
  function replaceIcon<T extends { icon?: unknown }>(node: T): T {
    if (node.icon === undefined || typeof node.icon === 'string') {
      node.icon = resolveIcon(node.icon);
    }
    return node;
  }

  return {
    name: 'prood:phosphor-icons',
    transformPageTree: {
      file: replaceIcon,
      folder: replaceIcon,
      separator: replaceIcon,
    },
  };
}

/** Map sidebar icon names to Phosphor icons (matches @prood/ui). */
export function phosphorIconsPlugin(options: { defaultIcon?: DocsIconName } = {}): LoaderPlugin {
  const { defaultIcon } = options;

  return iconPlugin((icon = defaultIcon) => {
    if (icon === undefined) return;

    const IconComponent = icons[icon as DocsIconName];
    if (!IconComponent) {
      console.warn(`[phosphor-icons-plugin] Unknown icon detected: ${icon}.`);
      return;
    }

    return createElement(IconComponent, { className: 'size-4' });
  });
}

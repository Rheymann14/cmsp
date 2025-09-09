// src/layouts/app-layout.tsx
import AppSidebarLayout from '@/layouts/app/app-sidebar-layout';
import AppHeaderLayout  from '@/layouts/app/app-header-layout';
import { useLayoutContext } from '@/contexts/layout-context';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode }       from 'react';

interface AppLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export default function AppLayout({ children, breadcrumbs }: AppLayoutProps) {
  const { layout } = useLayoutContext();         
  const Template = layout === 'header'
    ? AppHeaderLayout
    : AppSidebarLayout;

  return (
    <Template breadcrumbs={breadcrumbs}>
      {children}
    </Template>
  );
}

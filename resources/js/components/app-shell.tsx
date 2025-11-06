import { SidebarProvider } from '@/components/ui/sidebar';
import { SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

interface AppShellProps {
    children: React.ReactNode;
    variant?: 'header' | 'sidebar';
}

export function AppShell({ children, variant = 'header' }: AppShellProps) {
    const page = usePage<SharedData>();
    const isOpen = page.props.sidebarOpen;
    const user = page.props.auth?.user ?? null;

    useEffect(() => {
        if (!user) {
            router.visit(route('login'), { replace: true });
        }
    }, [user]);

    if (variant === 'header') {
        return <div className="flex min-h-screen w-full flex-col">{children}</div>;
    }

    return <SidebarProvider defaultOpen={isOpen}>{children}</SidebarProvider>;
}

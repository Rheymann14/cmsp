import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, LayoutGrid, UserRoundCog, NotebookText, House, FileSpreadsheet } from 'lucide-react';
import { AppLogo } from './app-logo';

export function AppSidebar() {
    const { props } = usePage<SharedData>();
    const auth = props.auth;

    // ✅ Check if user has Admin role safely
    const isAdmin =
        Array.isArray((auth.user as any)?.roles) &&
        (auth.user as any).roles.some((role: any) => role.role === 'Admin');

    const mainNavItems: NavItem[] = [
        {
            title: 'Home',
            href: '/reports',
            icon: House,
        },
        {
            title: 'Raw List',
            href: '/raw_list',
            icon: FileSpreadsheet,
        },
        {
            title: 'Reference',
            href: '/reference',
            icon: NotebookText,
        },
    ];

    // ✅ Conditionally include Role Management if Admin
    const footerNavItems: NavItem[] = [
        ...(isAdmin
            ? [
                {
                    title: 'Role Management',
                    href: '/role_management',
                    icon: UserRoundCog,
                },
            ]
            : []),
        // {
        //     title: 'User Manual',
        //     href: '#!',
        //     icon: BookOpen,
        // },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/reports" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

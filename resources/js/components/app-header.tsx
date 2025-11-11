import { Breadcrumbs } from '@/components/breadcrumbs';
import { Icon } from '@/components/icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NavigationMenu, NavigationMenuItem, NavigationMenuList, navigationMenuTriggerStyle } from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UserMenuContent } from '@/components/user-menu-content';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type NavItem, type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BookOpen, LayoutGrid, Menu, Search, UserRoundCog, NotebookText, House, FileSpreadsheet } from 'lucide-react';
import { AppLogo, AppLogoWide } from './app-logo';





interface AppHeaderProps {
  breadcrumbs?: BreadcrumbItem[];
}

export function AppHeader({ breadcrumbs = [] }: AppHeaderProps) {
  const page = usePage<SharedData>();
  const { auth } = page.props;
  const getInitials = useInitials();
  const avatarSrc =
    (auth.user as any).profile_photo_url ||
    (auth.user.profile_photo_path ? `/storage/${auth.user.profile_photo_path}` : undefined);

  const isAdmin = Array.isArray((auth.user as any)?.roles)
    && (auth.user as any).roles.some((role: any) => role.role === 'Admin');

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

  ];

  // ✅ Conditionally include Role Management only if Admin
  const rightNavItems: NavItem[] = [
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
    //   title: 'User Manual',
    //   href: '#!',
    //   icon: NotebookText,
    // },
  ];

  const activeItemStyles = 'text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100';

  return (
    <>
      {/* Top colored bar */}
      <div className="border-sidebar-border/80 border-b bg-[#1e3c72] text-white dark:bg-[#161615]">
        <div className="mx-auto flex h-16 items-center px-4 md:max-w-7xl">
          {/* Mobile Menu */}
          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2 h-[34px] w-[34px]">
                  <Menu className="h-5 w-5 text-white" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex h-full w-64 flex-col justify-between bg-sidebar">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetHeader>
                  <img src="/ro12_header_small.png" alt="Header" style={{ width: 180, height: 'auto' }} />
                </SheetHeader>
                <div className="flex h-full flex-1 flex-col justify-between p-4 text-sm">
                  <div className="flex flex-col space-y-4">
                    {mainNavItems.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        className="flex items-center space-x-2 font-medium"
                      >
                        {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                        <span>{item.title}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="flex flex-col space-y-4">
                    {rightNavItems.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        className="flex items-center space-x-2 font-medium"
                      >
                        {item.icon && <Icon iconNode={item.icon} className="h-5 w-5" />}
                        <span>{item.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo */}
          <Link href="/reports" prefetch className="flex items-center space-x-2">
            <AppLogoWide />
          </Link>

          {/* Desktop Right Menu */}
          <div className="ml-auto flex items-center space-x-2">
            <div className="hidden lg:flex">
              {rightNavItems.map((item) => (
                <TooltipProvider key={item.title} delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger>
                      <Link
                        href={item.href}
                        className="group ml-1 inline-flex h-9 w-9 items-center justify-center rounded-md bg-transparent p-0 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent hover:text-accent-foreground dark:hover:bg-neutral-800 dark:text-neutral-200"
                      >
                        <span className="sr-only">{item.title}</span>
                        {item.icon && (
                          <Icon
                            iconNode={item.icon}
                            className="h-5 w-5 text-white dark:text-neutral-200 group-hover:text-gray-800 dark:group-hover:text-white"
                          />
                        )}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{item.title}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="size-10 rounded-full p-1">
                  <Avatar className="size-8 overflow-hidden rounded-full">
                    {avatarSrc ? (
                      <AvatarImage src={avatarSrc} alt={auth.user.name} />
                    ) : (
                      <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                        {getInitials(auth.user.name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <UserMenuContent user={auth.user} />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Main navigation bar */}
      <div className="sticky top-0 border-b bg-white dark:bg-neutral-900 z-50">
        <div className="mx-auto flex h-12 items-center px-4 md:max-w-7xl lg:flex hidden">
          <NavigationMenu className="flex h-full items-stretch">
            <NavigationMenuList className="flex h-full items-stretch space-x-2">
              {mainNavItems.map((item, index) => (
                <NavigationMenuItem key={index} className="relative flex h-full items-center">
                  <Link
                    href={item.href}
                    className={cn(
                      navigationMenuTriggerStyle(),
                      page.url === item.href && activeItemStyles,
                      'h-9 cursor-pointer px-3'
                    )}
                  >
                    {item.icon && <Icon iconNode={item.icon} className="mr-2 h-4 w-4" />}
                    {item.title}
                  </Link>
                  {page.url === item.href && (
                    <div className="absolute bottom-0 left-0 h-0.5 w-full translate-y-px bg-black dark:bg-white" />
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>

      {/* Breadcrumbs */}
      {breadcrumbs.length > 1 && (
        <div className="flex w-full border-b border-sidebar-border/70">
          <div className="mx-auto flex h-12 w-full items-center justify-start px-4 text-neutral-500 md:max-w-7xl">
            <Breadcrumbs breadcrumbs={breadcrumbs} />
          </div>
        </div>
      )}
    </>
  );
}

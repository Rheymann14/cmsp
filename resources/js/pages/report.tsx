import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, X, UserX, Accessibility, Baby, Globe, Tent, FileSpreadsheet, CalendarRange, ChevronDown, ChevronUp, Loader2, SquarePen, GraduationCap, Check } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Badge } from "@/components/ui/badge";

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Home', href: '/dashboard' },
];

type SpecialGroupCounts = {
    pwd: number;
    solo_parent: number;
    first_generation: number;
    indigenous_people: number;
};

const EMPTY_SPECIAL_COUNTS: SpecialGroupCounts = {
    pwd: 0,
    solo_parent: 0,
    first_generation: 0,
    indigenous_people: 0,
};

const toStringOrEmpty = (value: unknown): string => {
    if (typeof value === 'string') {
        return value;
    }

    if (value === null || value === undefined) {
        return '';
    }

    return String(value);
};

type AyDeadlineOption = {
    id: number;
    academic_year: string;
    deadline: string;
    deadline_formatted: string;
    is_enabled: boolean;
};

const parseAyDeadlines = (input: unknown): AyDeadlineOption[] => {
    if (!Array.isArray(input)) {
        return [];
    }

    return input.reduce<AyDeadlineOption[]>((acc, item) => {
        if (!item || typeof item !== 'object') {
            return acc;
        }

        const raw = item as Record<string, unknown>;
        const rawId = raw.id;
        const parsedId =
            typeof rawId === 'number'
                ? rawId
                : Number.parseInt(typeof rawId === 'string' ? rawId : toStringOrEmpty(rawId), 10);

        if (!Number.isFinite(parsedId)) {
            return acc;
        }

        acc.push({
            id: parsedId,
            academic_year: toStringOrEmpty(raw.academic_year),
            deadline: toStringOrEmpty(raw.deadline),
            deadline_formatted: toStringOrEmpty(raw.deadline_formatted),
            is_enabled: Boolean(raw.is_enabled),
        });

        return acc;
    }, []);
};



const InDialogPopoverContent = React.forwardRef<
    HTMLDivElement,
    PopoverPrimitive.PopoverContentProps & { container?: HTMLElement | null }
>(({ container, sideOffset = 8, className, ...props }, ref) => {
    return (
        <PopoverPrimitive.Portal container={container ?? undefined}>
            <PopoverPrimitive.Content
                ref={ref}
                sideOffset={sideOffset}
                className={cn(
                    "z-[1000] w-[var(--radix-popover-trigger-width)] rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none",
                    className
                )}
                {...props}
            />
        </PopoverPrimitive.Portal>
    );
});
InDialogPopoverContent.displayName = "InDialogPopoverContent";




const resolveRoute = (name: string, params?: any, fallback?: string) => {
    try {
        if ((window as any).route) {
            return (window as any).route(name, params);
        }
    } catch {
        /* ignore */
    }
    return fallback || '/';
};



// Strip host from any Ziggy/route() output so requests stay same-origin
const toPath = (href: string) => {
    try {
        const u = new URL(href, window.location.origin);
        return u.pathname + u.search + u.hash;
    } catch {
        return href;
    }
};

export default function Dashboard() {
    const [specialCounts, setSpecialCounts] = useState<SpecialGroupCounts>({ ...EMPTY_SPECIAL_COUNTS });
    const [ayDeadlines, setAyDeadlines] = useState<AyDeadlineOption[]>([]);
    const [selectedDeadlineId, setSelectedDeadlineId] = useState<number | null>(null);
    const [deadlinesLoading, setDeadlinesLoading] = useState(false);
    const [deadlineDialogOpen, setDeadlineDialogOpen] = useState(false);
    const [tableFiltersReady, setTableFiltersReady] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const loadDeadlines = async () => {
            setDeadlinesLoading(true);
            try {
                const url = toPath(resolveRoute('ay-deadlines.index', undefined, '/ay-deadlines'));
                const res = await fetch(url, {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                });

                if (!res.ok) {
                    throw new Error('Failed to fetch academic year deadlines.');
                }

                const json = await res.json();
                if (cancelled) return;

                const parsed = parseAyDeadlines((json as { deadlines?: unknown })?.deadlines);
                setAyDeadlines(parsed);
                setSelectedDeadlineId((current) => {
                    if (current !== null && parsed.some((deadline) => deadline.id === current)) {
                        return current;
                    }

                    const preferred = parsed.find((deadline) => deadline.is_enabled) ?? parsed[0] ?? null;
                    return preferred ? preferred.id : null;
                });
            } catch (error) {
                if (cancelled) {
                    return;
                }

                setAyDeadlines([]);
                setSelectedDeadlineId(null);
                toast.error('Failed to load academic year deadlines.');
            } finally {
                if (!cancelled) {
                    setDeadlinesLoading(false);
                    setTableFiltersReady(true);
                }
            }
        };

        void loadDeadlines();

        return () => {
            cancelled = true;
        };
    }, []);

    const selectedDeadline = useMemo(
        () => ayDeadlines.find((deadline) => deadline.id === selectedDeadlineId) ?? null,
        [ayDeadlines, selectedDeadlineId]
    );

    const selectedAcademicYear = selectedDeadline?.academic_year ?? null;
    const selectedDeadlineDate = selectedDeadline?.deadline ?? null;

    const handleSpecialCounts = useCallback((counts: SpecialGroupCounts) => {
        setSpecialCounts({ ...counts });
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Home" />
            <Toaster
                richColors
                position="top-right"
                closeButton
                duration={4000}
            />
            <div className="text-center mt-2 mb-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-medium tracking-tight text-[#1e3c73] dark:text-zinc-100">
                   CMSP Report
                </h1>
            </div>

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 sm:p-6 lg:p-8 overflow-x-hidden">

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Dialog open={deadlineDialogOpen} onOpenChange={setDeadlineDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "self-start sm:self-auto gap-2",
                                    selectedAcademicYear
                                        ? "border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700/60 dark:text-blue-300 dark:hover:bg-blue-900/20"
                                        : "border-[#1e3c73] text-[#1e3c73] hover:bg-[#1e3c73]/10 dark:border-[#1e3c73] dark:text-zinc-100 dark:hover:bg-[#1e3c73]/20"
                                )}
                            >
                                <CalendarRange className="h-4 w-4" />
                                {selectedAcademicYear ? "Change academic year" : "Select academic year"}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px]">
                            <DialogHeader>
                                <DialogTitle>Select academic year</DialogTitle>
                                <DialogDescription>
                                    Choose an academic year deadline to filter the dashboard data.
                                </DialogDescription>
                            </DialogHeader>
                            <Command>
                                <CommandInput placeholder="Search academic year..." />
                                <CommandList>
                                    <CommandEmpty>
                                        {deadlinesLoading
                                            ? 'Loading deadlines...'
                                            : 'No academic year deadlines found.'}
                                    </CommandEmpty>
                                    {ayDeadlines.length > 0 ? (
                                        <CommandGroup heading="Academic year deadlines">
                                            {ayDeadlines.map((deadline) => (
                                                <CommandItem
                                                    key={deadline.id}
                                                    value={`AY ${deadline.academic_year}`}
                                                    onSelect={() => {
                                                        setSelectedDeadlineId(deadline.id);
                                                        setDeadlineDialogOpen(false);
                                                    }}
                                                >
                                                    <div className="flex flex-1 flex-col">
                                                        <span className="font-medium">
                                                            AY {deadline.academic_year}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {deadline.deadline_formatted
                                                                ? `Deadline: ${deadline.deadline_formatted}`
                                                                : 'No deadline date'}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {deadline.is_enabled ? (
                                                            <Badge variant="secondary" className="whitespace-nowrap">
                                                                Enabled
                                                            </Badge>
                                                        ) : null}
                                                        {selectedDeadlineId === deadline.id ? (
                                                            <Check className="h-4 w-4 text-[#1e3c73]" />
                                                        ) : null}
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    ) : null}
                                </CommandList>
                            </Command>
                        </DialogContent>
                    </Dialog>
                  
                        <div className="w-full flex flex-col   gap-1">
                            <div className="inline-flex  gap-2">
                                <span className="text-base font-semibold text-[#1e3c73] dark:text-zinc-100">
                                    {selectedAcademicYear ? `AY ${selectedAcademicYear}` : 'loading...'}
                                </span>

                            </div>

                            <span className="text-xs text-muted-foreground">
                                {selectedDeadline?.deadline_formatted
                                    ? `Deadline: ${selectedDeadline.deadline_formatted}`
                                    : 'No deadline date selected'}
                            </span>
                        </div>
                   
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

                    {/* PWD */}
                    <Card className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">PWD</CardTitle>
                            <div className="rounded-full p-2 bg-zinc-100 dark:bg-zinc-900">
                                <Accessibility className="h-5 w-5 text-[#1e3c73]" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold tracking-tight">{specialCounts.pwd.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">as of today</p>
                        </CardContent>
                    </Card>

                    {/* Solo Parent */}
                    <Card className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Solo Parent</CardTitle>
                            <div className="rounded-full p-2 bg-zinc-100 dark:bg-zinc-900">
                                <Baby className="h-5 w-5 text-[#1e3c73]" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold tracking-tight">{specialCounts.solo_parent.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">as of today</p>
                        </CardContent>
                    </Card>

                    {/* First Generation Students */}
                    <Card className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">First Generation Students</CardTitle>
                            <div className="rounded-full p-2 bg-zinc-100 dark:bg-zinc-900">
                                <GraduationCap className="h-5 w-5 text-[#1e3c73]" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold tracking-tight">{specialCounts.first_generation.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">as of today</p>
                        </CardContent>
                    </Card>

                    {/* Indigenous People (IP) */}
                    <Card className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Indigenous People (IP)</CardTitle>
                            <div className="rounded-full p-2 bg-zinc-100 dark:bg-zinc-900">
                                <Tent className="h-5 w-5 text-[#1e3c73]" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold tracking-tight">{specialCounts.indigenous_people.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">as of today</p>
                        </CardContent>
                    </Card>
                </div>

          

            </div>
        </AppLayout>
    );
}




   



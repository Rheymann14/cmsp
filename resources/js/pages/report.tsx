import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Loader2, CalendarRange, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Home', href: '/dashboard' },

];

const toStringOrEmpty = (value: unknown): string => {
    if (typeof value === 'string') {
        return value;
    }

    if (value === null || value === undefined) {
        return '';
    }

    return String(value);
};

interface DeadlineOption {
    id: number;
    academic_year: string;
    deadline: string;
    deadline_formatted: string;
    is_enabled: boolean;
}

interface SummaryResponse {
    totals: {
        applicants: number;
        qualified_applicants: number;
    };
    rank_counts: { rank: number; count: number }[];
    special_groups: { name: string; count: number; ranks: number[] }[];
}

const EMPTY_SUMMARY: SummaryResponse = {
    totals: { applicants: 0, qualified_applicants: 0 },
    rank_counts: [],
    special_groups: [],
};

type ZiggyRouteFn = (name: string, params?: unknown) => string;
type ZiggyWindow = typeof window & { route?: ZiggyRouteFn };

const resolveRoute = (name: string, params?: unknown, fallback?: string) => {
    try {
        const { route } = window as ZiggyWindow;
        if (typeof route === 'function') {
            return route(name, params);
        }
    } catch {
        /* ignore */
    }
    return fallback || '/';
};

const toPath = (href: string) => {
    try {
        const u = new URL(href, window.location.origin);
        return u.pathname + u.search + u.hash;
    } catch {
        return href;
    }
};

const parseAyDeadlines = (input: unknown): DeadlineOption[] => {
    if (!Array.isArray(input)) {
        return [];
    }

    return input.reduce<DeadlineOption[]>((acc, item) => {
        if (!item || typeof item !== 'object') {
            return acc;
        }

        const raw = item as Record<string, unknown>;
        const rawId = raw.id;
        const parsedId =
            typeof rawId === 'number'
                ? rawId
                : Number.parseInt(typeof rawId === 'string' ? rawId : String(rawId ?? ''), 10);

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

export default function ReportPage() {
    const [deadlines, setDeadlines] = useState<DeadlineOption[]>([]);
    const [loadingDeadlines, setLoadingDeadlines] = useState(false);
    const [deadlinesError, setDeadlinesError] = useState<string | null>(null);

    const [selectedDeadlineId, setSelectedDeadlineId] = useState<number | null>(null);
    const [deadlineDialogOpen, setDeadlineDialogOpen] = useState(false);

    const [summary, setSummary] = useState<SummaryResponse>(EMPTY_SUMMARY);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);

    const [newSlots, setNewSlots] = useState<string>('');

    useEffect(() => {
        let cancelled = false;
        const loadDeadlines = async () => {
            setLoadingDeadlines(true);
            setDeadlinesError(null);
            try {
                const url = toPath(resolveRoute('ay-deadlines.index', undefined, '/ay-deadlines'));
                const res = await fetch(url, {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                });

                if (!res.ok) {
                    throw new Error('Failed to load academic year deadlines.');
                }

                const json = (await res.json()) as { deadlines?: unknown };
                const parsed = parseAyDeadlines(json.deadlines ?? []);
                if (cancelled) {
                    return;
                }

                setDeadlines(parsed);
                setSelectedDeadlineId((current) => {
                    if (current !== null && parsed.some((deadline) => deadline.id === current)) {
                        return current;
                    }

                    const preferred = parsed.find((deadline) => deadline.is_enabled) ?? parsed[0] ?? null;
                    return preferred ? preferred.id : null;
                });
            } catch (error) {
                if (!cancelled) {
                    console.error(error);
                    setDeadlinesError('Unable to load academic year deadlines.');
                    setDeadlines([]);
                    setSelectedDeadlineId(null);
                }
            } finally {
                if (!cancelled) {
                    setLoadingDeadlines(false);
                }
            }
        };

        loadDeadlines();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!deadlines.length) {
            setSelectedDeadlineId(null);
            return;
        }

        if (selectedDeadlineId === null || !deadlines.some((deadline) => deadline.id === selectedDeadlineId)) {
            const preferred = deadlines.find((deadline) => deadline.is_enabled) ?? deadlines[0] ?? null;
            setSelectedDeadlineId(preferred ? preferred.id : null);
        }
    }, [deadlines, selectedDeadlineId]);

    const selectedDeadline = useMemo(
        () => deadlines.find((deadline) => deadline.id === selectedDeadlineId) ?? null,
        [deadlines, selectedDeadlineId],
    );

    const selectedAcademicYear = selectedDeadline?.academic_year ?? '';

    const buildSummaryUrl = useCallback((academicYear: string, deadline: string) => {
        const basePath = toPath(resolveRoute('reports.summary', undefined, '/reports/summary'));
        const u = new URL(basePath, window.location.origin);
        if (academicYear.trim()) {
            u.searchParams.set('academic_year', academicYear.trim());
        }
        if (deadline.trim()) {
            u.searchParams.set('deadline', deadline.trim());
        }
        return u.pathname + u.search + u.hash;
    }, []);

    useEffect(() => {
        if (!selectedDeadline) {
            setSummary(EMPTY_SUMMARY);
            return;
        }

        let cancelled = false;

        const loadSummary = async () => {
            setSummaryLoading(true);
            setSummaryError(null);
            try {
                const resolvedDeadline =
                    selectedDeadline.deadline.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? selectedDeadline.deadline;
                const res = await fetch(buildSummaryUrl(selectedAcademicYear, resolvedDeadline), {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                });

                if (!res.ok) {
                    const txt = await res.text().catch(() => '');
                    throw new Error(`Failed to load report summary (HTTP ${res.status}). ${txt.slice(0, 300)}`);
                }

                const json = (await res.json()) as SummaryResponse;
                if (!cancelled) {
                    setSummary(json);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(error);
                    setSummaryError(
                        error instanceof Error ? error.message : 'Unable to load report summary for the selected period.',
                    );
                    setSummary(EMPTY_SUMMARY);
                }
            }
            finally {
                if (!cancelled) {
                    setSummaryLoading(false);
                }
            }
        };

        loadSummary();
        return () => {
            cancelled = true;
        };
    }, [buildSummaryUrl, selectedAcademicYear, selectedDeadline]);

    const rankColumns = useMemo(() => {
        if (!summary.rank_counts.length) {
            return [] as { rank: number; count: number }[][];
        }
        const columns = 3;
        const perColumn = Math.ceil(summary.rank_counts.length / columns);
        return Array.from({ length: columns }, (_, index) =>
            summary.rank_counts.slice(index * perColumn, (index + 1) * perColumn),
        ).filter((col) => col.length > 0);
    }, [summary.rank_counts]);

    const totalRankedApplicants = useMemo(
        () => summary.rank_counts.reduce((acc, item) => acc + item.count, 0),
        [summary.rank_counts],
    );

    const formattedNewSlots = useMemo(() => {
        const parsed = Number.parseInt(newSlots.replace(/[^0-9]/g, ''), 10);
        return Number.isFinite(parsed) ? parsed : 0;
    }, [newSlots]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <Dialog open={deadlineDialogOpen} onOpenChange={setDeadlineDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                disabled={loadingDeadlines}
                                className={cn(
                                    'self-start gap-2 border-[#1e3c73] text-[#1e3c73] hover:bg-[#1e3c73]/10 dark:border-[#1e3c73] dark:text-zinc-100 dark:hover:bg-[#1e3c73]/20',
                                    !selectedAcademicYear && 'opacity-90',
                                )}
                            >
                                <CalendarRange className="h-4 w-4" />
                                {selectedAcademicYear ? 'Change academic year' : 'Select academic year'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[800px]">
                            <DialogHeader>
                                <DialogTitle>Select academic year</DialogTitle>
                                <DialogDescription>
                                    Choose an academic year deadline to filter the report data.
                                </DialogDescription>
                            </DialogHeader>
                            <Command>
                                <CommandInput placeholder="Search academic year..." />
                                <CommandList>
                                    <CommandEmpty>
                                        {loadingDeadlines ? 'Loading deadlines...' : 'No academic year deadlines found.'}
                                    </CommandEmpty>
                                    {deadlines.length > 0 ? (
                                        <CommandGroup heading="Academic year deadlines">
                                            {deadlines.map((deadline) => (
                                                <CommandItem
                                                    key={deadline.id}
                                                    value={`AY ${deadline.academic_year}`}
                                                    onSelect={() => {
                                                        setSelectedDeadlineId(deadline.id);
                                                        setDeadlineDialogOpen(false);
                                                    }}
                                                >
                                                    <div className="flex flex-1 flex-col">
                                                        <span className="font-medium">AY {deadline.academic_year || '—'}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {deadline.deadline_formatted
                                                                ? `Deadline: ${deadline.deadline_formatted}`
                                                                : deadline.deadline
                                                                    ? `Deadline: ${deadline.deadline}`
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
                                    {selectedAcademicYear ? `AY ${selectedAcademicYear}` : loadingDeadlines ? 'Loading…' : 'No academic year selected'}
                                </span>

                            </div>

                            <span className="text-xs text-muted-foreground">
                                {selectedDeadline?.deadline_formatted
                                ? `Deadline: ${selectedDeadline.deadline_formatted}`
                                : selectedDeadline?.deadline
                                    ? `Deadline: ${selectedDeadline.deadline}`
                                    : 'No deadline date selected'}
                            </span>
                        </div>
                </div>

                {(deadlinesError || summaryError) && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {deadlinesError ?? summaryError}
                    </div>
                )}

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card className="rounded-xl border border-sidebar-border/70 shadow-sm dark:border-sidebar-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                                Total number of applicants
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-semibold text-[#1e3c73]">
                                    {summaryLoading ? <Loader2 className="h-7 w-7 animate-spin" /> : summary.totals.applicants.toLocaleString()}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl border border-sidebar-border/70 shadow-sm dark:border-sidebar-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                                Total number of qualified applicants
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-3xl font-semibold text-[#1e3c73]">
                                    {summaryLoading ? <Loader2 className="h-7 w-7 animate-spin" /> : summary.totals.qualified_applicants.toLocaleString()}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl border border-sidebar-border/70 shadow-sm dark:border-sidebar-border">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
                                New slots
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Input
                                value={newSlots}
                                onChange={(event) => setNewSlots(event.target.value.replace(/[^0-9]/g, ''))}
                                inputMode="numeric"
                                placeholder="Enter slots"
                                className="h-12 rounded-lg"
                            />
                            {formattedNewSlots > 0 && (
                                <p className="text-xs font-medium text-muted-foreground">
                                    {formattedNewSlots.toLocaleString()} slots entered
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </section>

                <section className="space-y-4">
                    <Card className="rounded-xl border border-sidebar-border/70 shadow-sm dark:border-sidebar-border">
                        <CardHeader className="space-y-1 border-b border-sidebar-border/60 pb-4 dark:border-sidebar-border">
                            <CardTitle className="text-lg font-semibold text-[#1e3c73]">
                                CHED Merit Scholarship Program {selectedAcademicYear ? `(${selectedAcademicYear})` : ''}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Special group distribution with corresponding rank placements.
                            </p>
                        </CardHeader>
                        <CardContent className="px-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[40%] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Special Group
                                        </TableHead>
                                        <TableHead className="w-[20%] text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            No. of Applicants
                                        </TableHead>
                                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            Ranks
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {summary.special_groups.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                                                {summaryLoading ? 'Loading special groups…' : 'No special group data found for the selected period.'}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        summary.special_groups.map((group) => (
                                            <TableRow key={group.name}>
                                                <TableCell className="font-medium text-[#1e3c73] dark:text-zinc-100">
                                                    {group.name}
                                                </TableCell>
                                                <TableCell className="text-right font-semibold text-[#1e3c73] dark:text-zinc-100">
                                                    {group.count.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-[#1e3c73] dark:text-zinc-100">
                                                    {group.ranks.length
                                                        ? group.ranks.map((rank) => `#${rank}`).join(', ')
                                                        : '—'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card className="rounded-xl border border-sidebar-border/70 shadow-sm dark:border-sidebar-border">
                        <CardHeader className="space-y-1 border-b border-sidebar-border/60 pb-4 dark:border-sidebar-border">
                            <CardTitle className="text-lg font-semibold text-[#1e3c73]">
                                Rank distribution {selectedAcademicYear ? `(${selectedAcademicYear})` : ''}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Number of applicants per rank based on computed points. Ties share the same rank.
                            </p>
                        </CardHeader>
                        <CardContent>
                            {summary.rank_counts.length === 0 ? (
                                <div className="py-8 text-center text-sm text-muted-foreground">
                                    {summaryLoading ? 'Loading rank distribution…' : 'No ranking data found for the selected period.'}
                                </div>
                            ) : (
                                <div className="grid gap-6 lg:grid-cols-3">
                                    {rankColumns.map((column, columnIndex) => (
                                        <div
                                            key={columnIndex}
                                            className="rounded-xl border border-sidebar-border/60 bg-zinc-50 p-4 dark:border-sidebar-border dark:bg-zinc-900"
                                        >
                                            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                                                <span>Rank</span>
                                                <span>No. of Applicants</span>
                                            </div>
                                            <div className="mt-3 space-y-2">
                                                {column.map((item) => (
                                                    <div
                                                        key={item.rank}
                                                        className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm font-medium text-[#1e3c73] shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                                                    >
                                                        <span className="font-semibold">{item.rank.toLocaleString()}</span>
                                                        <span>{item.count.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="mt-6 rounded-xl border border-sidebar-border/60 bg-[#1e3c73]/5 px-4 py-3 text-sm font-semibold text-[#1e3c73] dark:border-sidebar-border dark:bg-[#1e3c73]/20 dark:text-zinc-100">
                                Total applicants in distribution: {totalRankedApplicants.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}

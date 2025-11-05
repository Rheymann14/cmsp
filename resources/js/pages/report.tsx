import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { CalendarRange, Loader2, Check, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Home', href: '/dashboard' },
    { title: 'Reports', href: '/reports' },
];

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
            academic_year: typeof raw.academic_year === 'string' ? raw.academic_year : '',
            deadline: typeof raw.deadline === 'string' ? raw.deadline : '',
            deadline_formatted: typeof raw.deadline_formatted === 'string' ? raw.deadline_formatted : '',
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
                if (!cancelled) {
                    setDeadlines(parsed);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(error);
                    setDeadlinesError('Unable to load academic year deadlines.');
                    setDeadlines([]);
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

        if (selectedDeadlineId === null) {
            setSelectedDeadlineId(deadlines[0]?.id ?? null);
            return;
        }

        const exists = deadlines.some((deadline) => deadline.id === selectedDeadlineId);
        if (!exists) {
            setSelectedDeadlineId(deadlines[0]?.id ?? null);
        }
    }, [deadlines, selectedDeadlineId]);

    const selectedDeadline = useMemo(
        () => deadlines.find((deadline) => deadline.id === selectedDeadlineId) ?? null,
        [deadlines, selectedDeadlineId],
    );

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
                const res = await fetch(
                    buildSummaryUrl(selectedDeadline.academic_year, selectedDeadline.deadline),
                    {
                        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                        credentials: 'same-origin',
                    },
                );

                if (!res.ok) {
                    const error = await res.text();
                    throw new Error(`Failed to load report summary. ${res.status} ${res.statusText}: ${error}`);
                }

                const json = (await res.json()) as SummaryResponse;
                if (!cancelled) {
                    setSummary(json);
                }
            } catch (error) {
                if (!cancelled) {
                    console.error(error);
                    setSummaryError('Unable to load report summary for the selected period.');
                    setSummary(EMPTY_SUMMARY);
                }
            } finally {
                if (!cancelled) {
                    setSummaryLoading(false);
                }
            }
        };

        loadSummary();
        return () => {
            cancelled = true;
        };
    }, [buildSummaryUrl, selectedDeadline]);

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
            <Head title="CMSP Report" />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#1e3c73]">
                            CMSP Report
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {selectedDeadline
                                ? `CHED Merit Scholarship Program AY ${selectedDeadline.academic_year}`
                                : 'Select an academic year deadline to view the report.'}
                        </p>
                    </div>
                    <Dialog open={deadlineDialogOpen} onOpenChange={setDeadlineDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'gap-2 self-start sm:self-auto',
                                    selectedDeadline
                                        ? 'border-blue-300 text-blue-700 hover:bg-blue-50'
                                        : 'border-[#1e3c73] text-[#1e3c73] hover:bg-[#1e3c73]/10',
                                )}
                                disabled={loadingDeadlines}
                            >
                                <CalendarRange className="h-4 w-4" />
                                {selectedDeadline ? 'Change academic year' : 'Select academic year'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[720px]">
                            <DialogHeader>
                                <DialogTitle>Select academic year</DialogTitle>
                                <DialogDescription>
                                    Choose an academic year deadline to filter the CMSP report data.
                                </DialogDescription>
                            </DialogHeader>
                            <Command>
                                <CommandInput placeholder="Search academic year..." />
                                <CommandList>
                                    <CommandEmpty>
                                        {loadingDeadlines ? 'Loading deadlines…' : 'No academic year deadlines found.'}
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
                                                    <div className="flex flex-1 flex-col gap-1">
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
                </div>

                {(deadlinesError || summaryError) && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        <AlertCircle className="h-4 w-4" />
                        <span>{deadlinesError ?? summaryError}</span>
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total applicants
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-semibold text-[#1e3c73]">
                                {summaryLoading ? (
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                ) : (
                                    summary.totals.applicants.toLocaleString()
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Qualified applicants
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-semibold text-[#1e3c73]">
                                {summaryLoading ? (
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                ) : (
                                    summary.totals.qualified_applicants.toLocaleString()
                                )}
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">New slots</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Input
                                value={newSlots}
                                onChange={(event) => setNewSlots(event.target.value.replace(/[^0-9]/g, ''))}
                                inputMode="numeric"
                                placeholder="Enter slots"
                            />
                            {formattedNewSlots > 0 ? (
                                <p className="text-xs text-muted-foreground">
                                    {formattedNewSlots.toLocaleString()} slots entered
                                </p>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-[#1e3c73]">
                            Special group distribution
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Applicants per special group with their corresponding ranks.
                        </p>
                    </CardHeader>
                    <CardContent className="px-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Special group</TableHead>
                                    <TableHead className="text-right">Applicants</TableHead>
                                    <TableHead>Ranks</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {summary.special_groups.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                                            {summaryLoading
                                                ? 'Loading special group data…'
                                                : 'No special group data found for the selected deadline.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    summary.special_groups.map((group) => (
                                        <TableRow key={group.name}>
                                            <TableCell className="font-medium">{group.name}</TableCell>
                                            <TableCell className="text-right">{group.count.toLocaleString()}</TableCell>
                                            <TableCell>
                                                {group.ranks.length > 0
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

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-[#1e3c73]">Rank distribution</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Number of applicants per computed rank. Applicants with the same points share the same rank.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {summary.rank_counts.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                {summaryLoading
                                    ? 'Loading rank distribution…'
                                    : 'No ranking data found for the selected deadline.'}
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {rankColumns.map((column, columnIndex) => (
                                    <div key={columnIndex} className="space-y-2 rounded-lg border border-slate-200 p-4">
                                        <div className="flex items-center justify-between text-xs font-medium uppercase text-muted-foreground">
                                            <span>Rank</span>
                                            <span>Applicants</span>
                                        </div>
                                        <div className="space-y-2">
                                            {column.map((item) => (
                                                <div
                                                    key={item.rank}
                                                    className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 text-sm"
                                                >
                                                    <span className="font-medium text-[#1e3c73]">
                                                        {item.rank.toLocaleString()}
                                                    </span>
                                                    <span>{item.count.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                            Total applicants in distribution: {totalRankedApplicants.toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

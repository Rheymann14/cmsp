import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';

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

    const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
    const [selectedDeadline, setSelectedDeadline] = useState<string>('');

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
            setSelectedAcademicYear('');
            setSelectedDeadline('');
            return;
        }

        const availableYears = Array.from(new Set(deadlines.map((d) => d.academic_year))).filter((year) => year);
        if (!availableYears.includes(selectedAcademicYear)) {
            const nextYear = availableYears[0] ?? '';
            setSelectedAcademicYear(nextYear);
            const firstDeadline = deadlines.find((d) => d.academic_year === nextYear);
            setSelectedDeadline(firstDeadline?.deadline ?? '');
            return;
        }

        const matchingDeadline = deadlines.find(
            (d) => d.academic_year === selectedAcademicYear && d.deadline === selectedDeadline,
        );
        if (!matchingDeadline) {
            const firstDeadline = deadlines.find((d) => d.academic_year === selectedAcademicYear);
            setSelectedDeadline(firstDeadline?.deadline ?? '');
        }
    }, [deadlines, selectedAcademicYear, selectedDeadline]);

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
        if (!selectedAcademicYear || !selectedDeadline) {
            setSummary(EMPTY_SUMMARY);
            return;
        }

        let cancelled = false;

        const loadSummary = async () => {
            setSummaryLoading(true);
            setSummaryError(null);
            try {
                const res = await fetch(buildSummaryUrl(selectedAcademicYear, selectedDeadline), {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                });

                if (!res.ok) {
                    throw new Error('Failed to load report summary.');
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
    }, [buildSummaryUrl, selectedAcademicYear, selectedDeadline]);

    const academicYearOptions = useMemo(() => {
        return Array.from(new Set(deadlines.map((d) => d.academic_year)))
            .filter((year) => year)
            .map((year) => ({ value: year, label: year }));
    }, [deadlines]);

    const deadlineOptions = useMemo(() => {
        return deadlines
            .filter((d) => d.academic_year === selectedAcademicYear)
            .map((d) => ({ value: d.deadline, label: d.deadline_formatted || d.deadline || '—' }));
    }, [deadlines, selectedAcademicYear]);

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

            <div className="space-y-8">
                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-2xl border border-[#1e3c73]/40 bg-[#1e3c73] text-white shadow-lg">
                        <div className="px-6 py-5 text-center">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em]">Total number of applicants</p>
                            <div className="mt-3 text-4xl font-bold">
                                {summaryLoading ? (
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                                ) : (
                                    summary.totals.applicants.toLocaleString()
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#1e3c73]/40 bg-[#1e3c73] text-white shadow-lg">
                        <div className="px-6 py-5 text-center">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em]">
                                Total number of qualified applicants
                            </p>
                            <div className="mt-3 text-4xl font-bold">
                                {summaryLoading ? (
                                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                                ) : (
                                    summary.totals.qualified_applicants.toLocaleString()
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-[#1e3c73]/40 bg-[#1e3c73] text-white shadow-lg">
                        <div className="px-6 py-5 text-center">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em]">New slots</p>
                            <Input
                                value={newSlots}
                                onChange={(event) => setNewSlots(event.target.value.replace(/[^0-9]/g, ''))}
                                inputMode="numeric"
                                placeholder="Enter slots"
                                className="mt-3 h-14 rounded-xl border-none bg-white/90 text-center text-3xl font-semibold text-[#1e3c73] focus-visible:ring-2 focus-visible:ring-white"
                            />
                            {formattedNewSlots > 0 && (
                                <p className="mt-2 text-xs font-medium uppercase tracking-[0.2em] text-white/80">
                                    {formattedNewSlots.toLocaleString()} slots entered
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-[#1e3c73]">Academic Year</Label>
                        <Select
                            value={selectedAcademicYear}
                            onValueChange={(value) => setSelectedAcademicYear(value)}
                            disabled={loadingDeadlines || !academicYearOptions.length}
                        >
                            <SelectTrigger className="h-11 rounded-xl border border-[#1e3c73]/40">
                                <SelectValue placeholder={loadingDeadlines ? 'Loading...' : 'Select academic year'} />
                            </SelectTrigger>
                            <SelectContent>
                                {academicYearOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-semibold text-[#1e3c73]">Deadline</Label>
                        <Select
                            value={selectedDeadline}
                            onValueChange={(value) => setSelectedDeadline(value)}
                            disabled={loadingDeadlines || !deadlineOptions.length}
                        >
                            <SelectTrigger className="h-11 rounded-xl border border-[#1e3c73]/40">
                                <SelectValue placeholder={loadingDeadlines ? 'Loading...' : 'Select deadline'} />
                            </SelectTrigger>
                            <SelectContent>
                                {deadlineOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </section>

                {(deadlinesError || summaryError) && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {deadlinesError ?? summaryError}
                    </div>
                )}

                <section className="space-y-4">
                    <Card className="border-[#1e3c73]/30 shadow-lg">
                        <CardHeader className="border-b border-[#1e3c73]/20 pb-4">
                            <CardTitle className="text-xl font-semibold tracking-wide text-[#1e3c73]">
                                CHED Merit Scholarship Program {selectedAcademicYear || '—'}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Special group distribution with corresponding rank placements.
                            </p>
                        </CardHeader>
                        <CardContent className="px-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[40%] text-[#1e3c73]">Special Group</TableHead>
                                        <TableHead className="w-[20%] text-right text-[#1e3c73]">No. of Applicants</TableHead>
                                        <TableHead className="text-[#1e3c73]">Ranks</TableHead>
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
                                                <TableCell className="font-medium">{group.name}</TableCell>
                                                <TableCell className="text-right font-semibold">
                                                    {group.count.toLocaleString()}
                                                </TableCell>
                                                <TableCell>
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

                    <Card className="border-[#1e3c73]/30 shadow-lg">
                        <CardHeader className="border-b border-[#1e3c73]/20 pb-4">
                            <CardTitle className="text-xl font-semibold tracking-wide text-[#1e3c73]">
                                Rank distribution ({selectedAcademicYear || '—'})
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
                                        <div key={columnIndex} className="rounded-xl border border-[#1e3c73]/20 bg-slate-50 p-4">
                                            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-[#1e3c73]">
                                                <span>Rank</span>
                                                <span>No. of Applicants</span>
                                            </div>
                                            <div className="mt-3 space-y-2">
                                                {column.map((item) => (
                                                    <div
                                                        key={item.rank}
                                                        className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm font-medium text-[#1e3c73] shadow-sm"
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
                            <div className="mt-6 rounded-xl border border-[#1e3c73]/30 bg-[#1e3c73]/10 px-4 py-3 text-sm font-semibold text-[#1e3c73]">
                                Total applicants in distribution: {totalRankedApplicants.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>
                </section>
            </div>
        </AppLayout>
    );
}

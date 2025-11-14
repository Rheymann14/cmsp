import AppLayout from '@/layouts/app-layout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { type BreadcrumbItem, type ReferencePoint, type SharedData } from '@/types';
import type { FormDataConvertible } from '@inertiajs/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Loader2, CalendarRange, Check } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reference', href: '/reference' },
];

interface ReferencePageProps {
    gradePoints: ReferencePoint[];
    incomePoints: ReferencePoint[];
}

interface ReferenceFormItem extends Record<string, FormDataConvertible> {
    id: number;
    equivalent_points: string;
}

interface DeadlineOption {
    id: number;
    academic_year: string;
    deadline: string;
    deadline_formatted: string;
    is_enabled: boolean;
    new_slots: number;
}

const formatGradeValue = (value: number) =>
    Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2);

const formatIncomeValue = (value: number) =>
    new Intl.NumberFormat('en-PH', { minimumFractionDigits: 0 }).format(value);

const toStringOrEmpty = (value: unknown): string => {
    if (typeof value === 'string') {
        return value;
    }
    if (value === null || value === undefined) {
        return '';
    }
    return String(value);
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
            new_slots:
                typeof raw.new_slots === 'number'
                    ? Math.max(0, Math.trunc(raw.new_slots))
                    : (() => {
                          const parsedSlots = Number.parseInt(
                              typeof raw.new_slots === 'string' ? raw.new_slots : String(raw.new_slots ?? ''),
                              10,
                          );
                          return Number.isFinite(parsedSlots) ? Math.max(0, parsedSlots) : 0;
                      })(),
        });

        return acc;
    }, []);
};

const normalizeDeadlineValue = (value: string) => {
    if (!value.trim()) {
        return '';
    }

    const match = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    return match ?? value.trim();
};

type ZiggyRouteFn = (name: string, params?: unknown, absolute?: boolean) => string;
type ZiggyWindow = typeof window & { route?: ZiggyRouteFn };

const resolveRoute = (name: string, params?: unknown, fallback?: string) => {
    try {
        const { route } = window as ZiggyWindow;
        if (typeof route === 'function') {
            return route(name, params, false);
        }
    } catch {
        /* ignore */
    }
    return fallback ?? '/';
};

const toPath = (href: string) => {
    try {
        const u = new URL(href, window.location.origin);
        return u.pathname + u.search + u.hash;
    } catch {
        return href;
    }
};

export default function ReferencePage({ gradePoints, incomePoints }: ReferencePageProps) {
    const {
        flash,
        ziggy,
    } = usePage<SharedData>().props;

    const initialFilters = useMemo(() => {
        const location = ziggy?.location ?? '';
        if (!location) {
            return { academicYear: '', deadline: '' };
        }

        try {
            const url = new URL(location);
            return {
                academicYear: url.searchParams.get('academic_year') ?? '',
                deadline: url.searchParams.get('deadline') ?? '',
            };
        } catch {
            return { academicYear: '', deadline: '' };
        }
    }, [ziggy?.location]);

    const referenceItems = useMemo(
        () =>
            [...gradePoints, ...incomePoints].map((point) => ({
                id: point.id,
                equivalent_points: String(point.equivalent_points),
            })),
        [gradePoints, incomePoints],
    );

    const { data, setData, put, processing } = useForm<{
        items: ReferenceFormItem[];
        academic_year: string;
        deadline: string;
    }>({
        items: referenceItems,
        academic_year: initialFilters.academicYear,
        deadline: initialFilters.deadline,
    });

    const [deadlines, setDeadlines] = useState<DeadlineOption[]>([]);
    const [loadingDeadlines, setLoadingDeadlines] = useState(false);
    const [deadlinesError, setDeadlinesError] = useState<string | null>(null);
    const [deadlineDialogOpen, setDeadlineDialogOpen] = useState(false);
    const [selectedDeadlineId, setSelectedDeadlineId] = useState<number | null>(null);
    const [reloadingReferencePoints, setReloadingReferencePoints] = useState(false);

    useEffect(() => {
        setData('items', referenceItems);
    }, [referenceItems, setData]);

    const loadDeadlines = useCallback(async () => {
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
            setDeadlines(parsed);

            setSelectedDeadlineId((current) => {
                if (current !== null && parsed.some((deadline) => deadline.id === current)) {
                    return current;
                }

                if (initialFilters.academicYear || initialFilters.deadline) {
                    const normalizedFilterDeadline = normalizeDeadlineValue(initialFilters.deadline);
                    const target = parsed.find((deadline) => {
                        const matchesAcademicYear = initialFilters.academicYear
                            ? deadline.academic_year === initialFilters.academicYear
                            : true;
                        const normalizedDeadline = normalizeDeadlineValue(deadline.deadline);
                        const matchesDeadline = normalizedFilterDeadline
                            ? normalizedFilterDeadline === normalizedDeadline
                            : true;
                        return matchesAcademicYear && matchesDeadline;
                    });

                    if (target) {
                        return target.id;
                    }
                }

                const preferred = parsed.find((deadline) => deadline.is_enabled) ?? parsed[0] ?? null;
                return preferred ? preferred.id : null;
            });
        } catch (error) {
            console.error(error);
            setDeadlines([]);
            setSelectedDeadlineId(null);
            const message =
                error instanceof Error ? error.message : 'Unable to load academic year deadlines.';
            setDeadlinesError(message);
            toast.error(message);
        } finally {
            setLoadingDeadlines(false);
        }
    }, [initialFilters.academicYear, initialFilters.deadline]);

    useEffect(() => {
        void loadDeadlines();
    }, [loadDeadlines]);

    useEffect(() => {
        if (!deadlines.length) {
            setSelectedDeadlineId(null);
            return;
        }

        setSelectedDeadlineId((current) => {
            if (current !== null && deadlines.some((deadline) => deadline.id === current)) {
                return current;
            }

            const preferred = deadlines.find((deadline) => deadline.is_enabled) ?? deadlines[0] ?? null;
            return preferred ? preferred.id : null;
        });
    }, [deadlines]);

    const selectedDeadline = useMemo(
        () => deadlines.find((deadline) => deadline.id === selectedDeadlineId) ?? null,
        [deadlines, selectedDeadlineId],
    );

    const selectedDeadlineValue = useMemo(() => {
        if (!selectedDeadline?.deadline) {
            return '';
        }

        return normalizeDeadlineValue(selectedDeadline.deadline);
    }, [selectedDeadline?.deadline]);

    useEffect(() => {
        setData('academic_year', selectedDeadline?.academic_year ?? '');
    }, [selectedDeadline?.academic_year, setData]);

    useEffect(() => {
        setData('deadline', selectedDeadlineValue);
    }, [selectedDeadlineValue, setData]);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
    }, [flash?.success]);

    useEffect(() => {
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash?.error]);

    const handlePointChange = (id: number, value: string) => {
        setData('items', data.items.map((item) => (item.id === id ? { ...item, equivalent_points: value } : item)));
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedDeadline) {
            toast.error('Please select an academic year deadline before saving changes.');
            return;
        }

        put(route('reference.update'), {
            preserveScroll: true,
            onSuccess: (page) => {
                const flashMessage =
                    page &&
                    typeof page === 'object' &&
                    'props' in page &&
                    page.props &&
                    typeof page.props === 'object' &&
                    'flash' in page.props &&
                    page.props.flash &&
                    typeof page.props.flash === 'object' &&
                    page.props.flash !== null &&
                    'success' in page.props.flash &&
                    typeof page.props.flash.success === 'string'
                        ? page.props.flash.success
                        : null;

                toast.success(flashMessage ?? 'Reference points updated successfully.');
            },
            onError: (formErrors) => {
                const message = Object.values(formErrors).find(Boolean);
                toast.error(message ?? 'Unable to save reference points.');
            },
        });
    };

    const valueFor = (id: number) => data.items.find((item) => item.id === id)?.equivalent_points ?? '';

    const handleDeadlineSelect = useCallback(
        (deadline: DeadlineOption) => {
            setSelectedDeadlineId(deadline.id);
            setDeadlineDialogOpen(false);

            const normalizedDeadline = normalizeDeadlineValue(deadline.deadline);
            setReloadingReferencePoints(true);

            router.get(
                route('reference.index'),
                {
                    academic_year: deadline.academic_year,
                    deadline: normalizedDeadline,
                },
                {
                    preserveScroll: true,
                    replace: true,
                    only: ['gradePoints', 'incomePoints', 'flash'],
                    onFinish: () => {
                        setReloadingReferencePoints(false);
                    },
                },
            );
        },
        [],
    );

    const isFormDisabled = processing || reloadingReferencePoints || !selectedDeadline;

    const selectedDeadlineDescription = selectedDeadline
        ? selectedDeadline.deadline_formatted
            ? `Deadline: ${selectedDeadline.deadline_formatted}`
            : selectedDeadline.deadline
                ? `Deadline: ${selectedDeadline.deadline}`
                : 'No deadline date'
        : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reference Points" />
            <Toaster richColors position="top-right" closeButton duration={4000} />
            <div className="flex flex-col gap-6 rounded-xl p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight text-[#1e3c72] dark:text-zinc-100">
                            Reference Points
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Adjust the equivalent points used to compute the CMSP ranking.
                        </p>
                        {selectedDeadline ? (
                            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                                <span className="font-semibold text-[#1e3c73] dark:text-zinc-100">
                                    AY {selectedDeadline.academic_year || '—'}
                                </span>
                                {selectedDeadlineDescription ? <span>{selectedDeadlineDescription}</span> : null}
                            </div>
                        ) : (
                            <p className="text-sm font-medium text-destructive">
                                Select an academic year deadline to manage reference points.
                            </p>
                        )}
                    </div>
                    <Dialog open={deadlineDialogOpen} onOpenChange={setDeadlineDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                disabled={loadingDeadlines}
                                className={cn(
                                    'self-start gap-2 border-[#1e3c73] text-[#1e3c73] hover:bg-[#1e3c73]/10 dark:border-[#1e3c73] dark:text-zinc-100 dark:hover:bg-[#1e3c73]/20',
                                    !selectedDeadline && 'opacity-90',
                                )}
                            >
                                <CalendarRange className="h-4 w-4" />
                                {selectedDeadline ? 'Change academic year' : 'Select academic year'}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[700px]">
                            <DialogHeader>
                                <DialogTitle>Select academic year</DialogTitle>
                                <DialogDescription>
                                    Choose an academic year deadline to update the reference points.
                                </DialogDescription>
                            </DialogHeader>
                            <Command>
                                <CommandInput placeholder="Search academic year..." />
                                <CommandList>
                                    <CommandEmpty>
                                        {loadingDeadlines
                                            ? 'Loading deadlines...'
                                            : 'No academic year deadlines found.'}
                                    </CommandEmpty>
                                    {deadlines.length > 0 ? (
                                        <CommandGroup heading="Academic year deadlines">
                                            {deadlines.map((deadline) => (
                                                <CommandItem
                                                    key={deadline.id}
                                                    value={`AY ${deadline.academic_year}`}
                                                    onSelect={() => handleDeadlineSelect(deadline)}
                                                >
                                                    <div className="flex flex-1 flex-col">
                                                        <span className="font-medium">
                                                            AY {deadline.academic_year || '—'}
                                                        </span>
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
                </div>

                {deadlinesError ? (
                    <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                        {deadlinesError}
                    </div>
                ) : null}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Grade Equivalent Points</CardTitle>
                            <CardDescription>
                                Define how the General Weighted Average (GWA) translates into equivalent points.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-32">From</TableHead>
                                        <TableHead className="w-32">To</TableHead>
                                        <TableHead className="w-48">Equivalent Points</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {gradePoints.map((point) => (
                                        <TableRow key={`grade-${point.id}`}>
                                            <TableCell>{formatGradeValue(point.range_from)}</TableCell>
                                            <TableCell>{point.range_to !== null ? formatGradeValue(point.range_to) : '—'}</TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    step={1}
                                                    value={valueFor(point.id)}
                                                    onChange={(event) => handlePointChange(point.id, event.target.value)}
                                                    disabled={isFormDisabled}
                                                    className="w-28"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Income Equivalent Points</CardTitle>
                            <CardDescription>
                                Configure the equivalent points based on the household&#39;s annual income.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-40">From</TableHead>
                                        <TableHead className="w-40">To</TableHead>
                                        <TableHead className="w-48">Equivalent Points</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {incomePoints.map((point) => (
                                        <TableRow key={`income-${point.id}`}>
                                            <TableCell>₱{formatIncomeValue(point.range_from)}</TableCell>
                                            <TableCell>
                                                {point.range_to !== null ? `₱${formatIncomeValue(point.range_to)}` : 'and above'}
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    min={0}
                                                    max={100}
                                                    step={1}
                                                    value={valueFor(point.id)}
                                                    onChange={(event) => handlePointChange(point.id, event.target.value)}
                                                    disabled={isFormDisabled}
                                                    className="w-28"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isFormDisabled}>
                            {(processing || reloadingReferencePoints) && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

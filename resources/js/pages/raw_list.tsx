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
import { Search, ChevronLeft, ChevronRight, X, UserX, Accessibility, Baby, Globe, Tent, FileSpreadsheet, CalendarRange, ChevronDown, ChevronUp, Loader2, SquarePen, GraduationCap, Check, Copy, ChevronsUpDown } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { Badge } from "@/components/ui/badge";

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Raw List', href: '/raw_list' },
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

const SIBLING_OPTIONS = Array.from({ length: 15 }, (_, index) => index + 1);
const INITIAL_RANK_OPTIONS = ['FPESFA', 'FPESFA-GAD', 'FSSP', 'HPESFA', 'HPGAD', 'HSSP'] as const;
const EMPTY_VALIDATION_FORM = {
    document_status: '',
    no_siblings: '',
    initial_rank: '',
    remarks: '',
};

const QUALIFIED_REMARK = 'Qualified Applicant';
const DISQUALIFIED_REMARK = 'Disqualified';
const DISQUALIFIED_MIN_AVERAGE = 93;
const DISQUALIFIED_MAX_COMBINED_PARENT_YEARLY_INCOME = 501000;

const toNumberSafe = (value: unknown): number => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === 'string') {
        const normalized = value.replace(/[^\d.-]/g, '');
        if (!normalized) {
            return 0;
        }

        const parsed = Number.parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
};

const isDisqualifiedRemarks = (remarks: string | null | undefined): boolean => {
    return typeof remarks === 'string' && remarks.trim().toLowerCase().startsWith(DISQUALIFIED_REMARK.toLowerCase());
};

const getAutoRemarksForRow = (row: {
    father_income_yearly_bracket?: unknown;
    mother_income_yearly_bracket?: unknown;
    gwa_g12_s1?: unknown;
    gwa_g12_s2?: unknown;
} | null | undefined): string => {
    if (!row) {
        return QUALIFIED_REMARK;
    }

    const fatherYearly = toNumberSafe(row.father_income_yearly_bracket);
    const motherYearly = toNumberSafe(row.mother_income_yearly_bracket);
    const combinedParentYearlyIncome = fatherYearly + motherYearly;

    const roundedAverage = Math.round((toNumberSafe(row.gwa_g12_s1) + toNumberSafe(row.gwa_g12_s2)) / 2);

    const isIncomeDisqualified = combinedParentYearlyIncome > DISQUALIFIED_MAX_COMBINED_PARENT_YEARLY_INCOME;
    const isAverageDisqualified = roundedAverage < DISQUALIFIED_MIN_AVERAGE;

    if (!isIncomeDisqualified && !isAverageDisqualified) {
        return QUALIFIED_REMARK;
    }

    if (isIncomeDisqualified && isAverageDisqualified) {
        return `${DISQUALIFIED_REMARK} - Combined salary exceeded 501k, did not meet the grade requirement`;
    }

    if (isIncomeDisqualified) {
        return `${DISQUALIFIED_REMARK} - Combined salary exceeded 501k`;
    }

    return `${DISQUALIFIED_REMARK} - Did not meet the grade requirement`;
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


const parseSpecialGroupCounts = (input: unknown): SpecialGroupCounts => {
    const toNumber = (value: unknown): number => {
        if (typeof value === 'number') {
            return Number.isFinite(value) ? value : 0;
        }

        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed === '') {
                return 0;
            }

            const parsed = Number(trimmed);
            return Number.isFinite(parsed) ? parsed : 0;
        }

        return 0;
    };

    if (!input || typeof input !== 'object') {
        return { ...EMPTY_SPECIAL_COUNTS };
    }

    const raw = input as Partial<Record<keyof SpecialGroupCounts, unknown>>;

    return {
        pwd: toNumber(raw.pwd),
        solo_parent: toNumber(raw.solo_parent),
        first_generation: toNumber(raw.first_generation),
        indigenous_people: toNumber(raw.indigenous_people),
    };
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

// Read the XSRF cookie set by Laravel's CSRF middleware
const getXsrfToken = () => {
    const m = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : '';
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

export default function RawList() {
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
            <Head title="Raw List" />
            <Toaster
                richColors
                position="top-right"
                closeButton
                duration={4000}
            />
            <div className="text-center mt-2 mb-6">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-medium tracking-tight text-[#1e3c73] dark:text-zinc-100">
                    CHED Merit Scholarship Program (CMSP)
                </h1>
            </div>

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 sm:p-6 lg:p-8 overflow-x-visible">

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
                                    Choose an academic year deadline to filter the raw list data.
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

                <div className="w-full min-w-0">
                    {/* Break out of AppLayout max width so the table can use the viewport width. */}
                    <div className="relative left-1/2 w-screen -translate-x-1/2 px-4 sm:px-6 lg:px-8">
                        <div className="mx-auto w-full max-w-[92rem] rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                            <CmspsTable
                                onSpecialCounts={handleSpecialCounts}
                                academicYear={selectedAcademicYear}
                                deadline={selectedDeadlineDate}
                                ready={tableFiltersReady}
                            />
                        </div>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}

/* ---------- Reusable truncation cell ---------- */
function TruncateCell({
    value,
    max = 32,
}: {
    value: string | number | null | undefined;
    max?: number;
}) {
    const [expanded, setExpanded] = useState(false);
    const raw = value === null || value === undefined || value === '' ? '—' : String(value);
    const isLong = raw.length > max;
    const shown = !isLong || expanded ? raw : raw.slice(0, Math.max(0, max - 1)) + '…';

    return (
        <div className="inline-flex max-w-full flex-wrap items-start gap-1">
            <span className="whitespace-pre-wrap break-words leading-snug min-w-0">{shown}</span>
            {isLong && (
                <button
                    type="button"
                    aria-expanded={expanded}
                    aria-label={expanded ? 'Hide full text' : 'Show full text'}
                    title={expanded ? 'Hide' : 'Show more'}
                    onClick={() => setExpanded((s) => !s)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded((s) => !s); }
                    }}
                    className="inline-flex items-center gap-1 shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium
                     text-[#1e3c73] hover:text-[#1a3565] hover:bg-zinc-100 dark:hover:bg-zinc-800
                     focus:outline-none focus:ring-1 focus:ring-[#1e3c73] transition-colors"
                >
                    {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    {expanded ? 'Hide' : 'Show'}
                </button>
            )}
        </div>
    );
}

function CmspsTable({
    onSpecialCounts,
    academicYear,
    deadline,
    ready = true,
}: {
    onSpecialCounts?: (counts: SpecialGroupCounts) => void;
    academicYear?: string | null;
    deadline?: string | null;
    ready?: boolean;
}) {
    const dialogContentRef = useRef<HTMLDivElement | null>(null);
    type ApplicationRow = {
        id: number;
        incoming: boolean;

        // identity / contact
        tracking_no: string;
        lrn: string;
        email: string;
        contact_number: string;

        // name
        last_name: string;
        first_name: string;
        middle_name: string;
        maiden_name: string | null;
        name_extension: string | null;

        // personal
        birthdate: string; // ISO
        age: number | null;
        sex: 'male' | 'female';

        ethnicity_id: number; ethnicity_name?: string;
        religion_id: number; religion_name?: string;
        province_municipality: number; province_municipality_name?: string;
        district: number; district_name?: string;
        intended_school: number; intended_school_name?: string;
        course: number; course_name?: string;

        // address (home)
        barangay: string;
        purok_street: string;
        zip_code: string | null;

        // address (BARMM optional)
        barmm_province: string | null;
        barmm_municipality: string | null;
        barmm_barangay: string | null;
        barmm_purok_street: string | null;
        barmm_zip_code: string | null;

        // acad intent
        school_type: 'Public' | 'LUC' | 'Private';
        other_school: string | null;
        year_level: string;
        gad_stufaps_course: string | null;

        // SHS
        shs_name: string;
        shs_address: string;
        shs_school_type: string;

        // family income
        father_name: string;
        father_occupation: string;
        father_income_monthly: number;
        father_income_yearly_bracket: string;

        mother_name: string;
        mother_occupation: string;
        mother_income_monthly: number;
        mother_income_yearly_bracket: string;

        guardian_name: string;
        guardian_occupation: string;
        guardian_income_monthly: number;

        // grades
        gwa_g12_s1: number;
        gwa_g12_s2: number;

        // attachments
        application_form_path: string | null;
        grades_g12_s1_path: string | null;
        grades_g12_s2_path: string | null;
        birth_certificate_path: string | null;
        proof_of_income_path: string | null;
        proof_of_special_group_path: string | null;
        guardianship_certificate_path: string | null;

        // misc
        special_groups: string[];
        consent: boolean;
        academic_year: string;
        deadline: string; // ISO date
        created_at: string; // ISO datetime

        final_total_points?: number | null;
        rank?: number | null;

        latest_validation?: {
            id: number;
            cmsp_id: number;
            tracking_no: string;
            document_status: string;
            no_siblings: number;
            initial_rank: string;
            remarks: string | null;
            checked_by: number;
            created_at: string;
            updated_at: string;
            checker?: {
                id: number;
                name: string;
            } | null;
        } | null;
    };

    const COLS = 50; // keep this in sync with the header

    const ATTACHMENTS = [
        { key: 'application_form_path', label: 'application form' },
        { key: 'grades_g12_s1_path', label: 'grades g12 s1' },
        { key: 'grades_g12_s2_path', label: 'grades g12 s2' },
        { key: 'birth_certificate_path', label: 'birth certificate' },
        { key: 'proof_of_income_path', label: 'proof of income' },
        { key: 'proof_of_special_group_path', label: 'special group' },
        { key: 'guardianship_certificate_path', label: 'guardianship' },
    ] as const;

    type AttachmentKey = typeof ATTACHMENTS[number]['key'];
    type AttachmentLabel = typeof ATTACHMENTS[number]['label'];
    type AttachmentItem = {
        label: AttachmentLabel;
        url: string | null;     // allow null so we can render “missing”
        missing: boolean;
    };

    const normalizeAttachmentUrl = (path: ApplicationRow[AttachmentKey]) => {
        if (!path) return null;
        if (/^https?:\/\//i.test(path)) return path;
        const trimmed = path.replace(/^\/+/, '');
        const withoutStorage = trimmed.replace(/^storage\//, '');
        return `/storage/${withoutStorage}`;
    };

    const renderAttachments = (row: ApplicationRow) => {
        const items: AttachmentItem[] = ATTACHMENTS.map(({ key, label }) => {
            const url = normalizeAttachmentUrl(row[key]); // string | null
            return { label, url, missing: !url };
        });

        return (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] leading-relaxed">
                <span className="font-medium text-muted-foreground">Files:</span>
                {items.map(({ label, url, missing }) =>
                    missing ? (
                        // Missing (red)
                        <span
                            key={label}
                            className="inline-flex items-center gap-1 text-red-600 dark:text-red-400"
                            title="Missing file"
                        >
                            <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden />
                            <span className="capitalize">{label}</span>
                        </span>
                    ) : (
                        // Present (green, clickable)
                        <a
                            key={label}
                            href={url!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-emerald-600 transition-colors hover:text-emerald-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:ring-offset-1"
                        >
                            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden />
                            <span className="capitalize">{label}</span>
                        </a>
                    )
                )}
            </div>
        );
    };

    const normalizeRow = useCallback((input: unknown): ApplicationRow | null => {
        if (!input || typeof input !== 'object') {
            return null;
        }

        const raw = input as Record<string, unknown> & {
            ethnicity?: { label?: unknown } | null;
            religion?: { label?: unknown } | null;
            district_model?: { name?: unknown } | null;
            school?: { name?: unknown } | null;
            course_model?: { name?: unknown } | null;
            location?: { municipality?: unknown; province?: unknown } | null;
        };

        const base = { ...raw } as ApplicationRow & Record<string, unknown>;

        const ethnicityLabel = raw.ethnicity && typeof raw.ethnicity === 'object' && typeof raw.ethnicity.label === 'string'
            ? raw.ethnicity.label.trim()
            : '';
        if (ethnicityLabel) {
            base.ethnicity_name = ethnicityLabel;
        }

        const religionLabel = raw.religion && typeof raw.religion === 'object' && typeof raw.religion.label === 'string'
            ? raw.religion.label.trim()
            : '';
        if (religionLabel) {
            base.religion_name = religionLabel;
        }

        const districtName = raw.district_model && typeof raw.district_model === 'object' && typeof raw.district_model.name === 'string'
            ? raw.district_model.name.trim()
            : '';
        if (districtName) {
            base.district_name = districtName;
        }

        const schoolName = raw.school && typeof raw.school === 'object' && typeof raw.school.name === 'string'
            ? raw.school.name.trim()
            : '';
        if (schoolName) {
            base.intended_school_name = schoolName;
        }

        const courseName = raw.course_model && typeof raw.course_model === 'object' && typeof raw.course_model.name === 'string'
            ? raw.course_model.name.trim()
            : '';
        if (courseName) {
            base.course_name = courseName;
        }

        if (raw.location && typeof raw.location === 'object') {
            const municipality = typeof raw.location.municipality === 'string' ? raw.location.municipality.trim() : '';
            const province = typeof raw.location.province === 'string' ? raw.location.province.trim() : '';
            const combined = [municipality, province].filter((part) => part !== '').join(', ');
            if (combined) {
                base.province_municipality_name = combined;
            }
        }

        const toNumberOrNull = (value: unknown): number | null => {
            if (typeof value === 'number') {
                return Number.isFinite(value) ? value : null;
            }

            if (typeof value === 'string') {
                const trimmed = value.trim();
                if (trimmed === '') {
                    return null;
                }

                const parsed = Number(trimmed);
                return Number.isFinite(parsed) ? parsed : null;
            }

            return null;
        };

        base.final_total_points = toNumberOrNull(raw.final_total_points);
        base.rank = toNumberOrNull(raw.rank);

        delete base.ethnicity;
        delete base.religion;
        delete base.district_model;
        delete base.school;
        delete base.course_model;
        delete base.location;

        return base;
    }, []);

    const [rows, setRows] = useState<ApplicationRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

    const [validationDialogOpen, setValidationDialogOpen] = useState(false);
    const [validationRow, setValidationRow] = useState<ApplicationRow | null>(null);
    const [validationForm, setValidationForm] = useState({ ...EMPTY_VALIDATION_FORM });
    const [validationErrors, setValidationErrors] = useState<{ document_status?: string; no_siblings?: string; initial_rank?: string }>({});
    const [validationSubmitting, setValidationSubmitting] = useState(false);
    const [clearingValidation, setClearingValidation] = useState(false);
    const [siblingsPopoverOpen, setSiblingsPopoverOpen] = useState(false);
    const [rankPopoverOpen, setRankPopoverOpen] = useState(false);
    const [actionSort, setActionSort] = useState<'validated' | 'pending' | null>(null);
    const [rankSort, setRankSort] = useState<'asc' | 'desc' | null>(null);
    const [nameSort, setNameSort] = useState<'asc' | 'desc' | null>(null);
    const [pointsSort, setPointsSort] = useState<'asc' | 'desc' | null>(null);
    const [submittedSort, setSubmittedSort] = useState<'asc' | 'desc' | null>(null);

    useEffect(() => {
        setPage(1);
    }, [academicYear, deadline]);

    // AFTER
    const buildUrl = useCallback((p: number, s: string, pp: number) => {
        const basePath = toPath(resolveRoute('cmsp-applications.index.json', undefined, '/cmsp-applications/json'));
        const u = new URL(basePath, window.location.origin);
        u.searchParams.set('page', String(p));
        u.searchParams.set('per_page', String(pp));
        u.searchParams.set('full', '1');
        const trimmedSearch = s.trim();
        if (trimmedSearch) u.searchParams.set('search', trimmedSearch);
        const trimmedAcademicYear = typeof academicYear === 'string' ? academicYear.trim() : '';
        if (trimmedAcademicYear) {
            u.searchParams.set('academic_year', trimmedAcademicYear);
        }
        const trimmedDeadline = typeof deadline === 'string' ? deadline.trim() : '';
        if (trimmedDeadline) {
            u.searchParams.set('deadline', trimmedDeadline);
        }
        // return a same-origin path
        return u.pathname + u.search + u.hash;
    }, [academicYear, deadline]);

    const buildExportUrl = useCallback((s: string) => {
        const basePath = toPath(resolveRoute('cmsp-applications.export', undefined, '/cmsp-applications/export'));
        const u = new URL(basePath, window.location.origin);
        const trimmedSearch = s.trim();
        if (trimmedSearch) u.searchParams.set('search', trimmedSearch);
        const trimmedAcademicYear = typeof academicYear === 'string' ? academicYear.trim() : '';
        if (trimmedAcademicYear) {
            u.searchParams.set('academic_year', trimmedAcademicYear);
        }
        const trimmedDeadline = typeof deadline === 'string' ? deadline.trim() : '';
        if (trimmedDeadline) {
            u.searchParams.set('deadline', trimmedDeadline);
        }
        return u.pathname + u.search + u.hash;
    }, [academicYear, deadline]);

    const getValidationStoreUrl = () =>
        toPath((window as any).route ? (window as any).route('validations.store') : '/validations');

    const getValidationDestroyUrl = (id: number) =>
        toPath((window as any).route ? (window as any).route('validations.destroy', id) : `/validations/${id}`);


    const fetchData = useCallback(async (p = page, s = search, pp = perPage) => {
        setLoading(true);
        try {
            const res = await fetch(buildUrl(p, s, pp), {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error('Failed to load');
            const json = await res.json();
            const rawData: unknown[] = Array.isArray(json.data) ? json.data : [];
            const normalized = rawData
                .map((item) => normalizeRow(item))
                .filter((item): item is ApplicationRow => item !== null);
            setRows(normalized);
            setTotal(json.meta?.total ?? 0);
            setLastPage(json.meta?.last_page ?? 1);
            setPage(json.meta?.current_page ?? p);
            if (onSpecialCounts) {
                onSpecialCounts(parseSpecialGroupCounts(json.meta?.special_counts));
            }
            setSelectedId(null);
        } catch (e) {
            setRows([]);
            setTotal(0);
            setLastPage(1);
            if (onSpecialCounts) {
                onSpecialCounts({ ...EMPTY_SPECIAL_COUNTS });
            }
        } finally {
            setLoading(false);
        }
    }, [buildUrl, normalizeRow, onSpecialCounts]);

    const toggleActionSort = useCallback(() => {
        setActionSort((prev) => {
            const next = prev === 'validated'
                ? 'pending'
                : prev === 'pending'
                    ? null
                    : 'validated';

            if (next !== null) {
                setRankSort(null);
                setNameSort(null);
                setPointsSort(null);
                setSubmittedSort(null);
            }

            return next;
        });
    }, [setActionSort, setNameSort, setPointsSort, setRankSort, setSubmittedSort]);

    const toggleRankSort = useCallback(() => {
        setRankSort((prev) => {
            const next = prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc';

            if (next !== null) {
                setActionSort(null);
                setNameSort(null);
                setPointsSort(null);
                setSubmittedSort(null);
            }

            return next;
        });
    }, [setActionSort, setNameSort, setPointsSort, setRankSort, setSubmittedSort]);

    const toggleNameSort = useCallback(() => {
        setNameSort((prev) => {
            const next = prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc';

            if (next !== null) {
                setActionSort(null);
                setRankSort(null);
                setPointsSort(null);
                setSubmittedSort(null);
            }

            return next;
        });
    }, [setActionSort, setNameSort, setPointsSort, setRankSort, setSubmittedSort]);

    const togglePointsSort = useCallback(() => {
        setPointsSort((prev) => {
            const next = prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc';

            if (next !== null) {
                setActionSort(null);
                setRankSort(null);
                setNameSort(null);
                setSubmittedSort(null);
            }

            return next;
        });
    }, [setActionSort, setNameSort, setPointsSort, setRankSort, setSubmittedSort]);

    const toggleSubmittedSort = useCallback(() => {
        setSubmittedSort((prev) => {
            const next = prev === 'asc' ? 'desc' : prev === 'desc' ? null : 'asc';

            if (next !== null) {
                setActionSort(null);
                setNameSort(null);
                setPointsSort(null);
                setRankSort(null);
            }

            return next;
        });
    }, [setActionSort, setNameSort, setPointsSort, setRankSort, setSubmittedSort]);

    const handleCopyTracking = useCallback(async (trackingNo: string) => {
        const value = (trackingNo ?? '').trim();

        if (!value) {
            toast.error('Tracking number unavailable for copying.');
            return;
        }

        const notifySuccess = () => {
            toast.success('Tracking number copied to clipboard.');
        };

        const notifyFailure = () => {
            toast.error('Unable to copy tracking number.');
        };

        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(value);
                notifySuccess();
                return;
            }
        } catch (err) {
            // Fallback below
        }

        try {
            if (typeof document !== 'undefined') {
                const textarea = document.createElement('textarea');
                textarea.value = value;
                textarea.setAttribute('readonly', '');
                textarea.style.position = 'fixed';
                textarea.style.top = '0';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                textarea.select();
                const copied = document.execCommand('copy');
                document.body.removeChild(textarea);

                if (copied) {
                    notifySuccess();
                    return;
                }
            }
        } catch (err) {
            // Ignore and fall through to failure toast
        }

        notifyFailure();
    }, []);

    const displayRows = useMemo(() => {
        if (!actionSort && !rankSort && !nameSort && !pointsSort && !submittedSort) {
            return rows;
        }

        const getComparableRank = (value: ApplicationRow['rank']) =>
            typeof value === 'number' && Number.isFinite(value) ? value : null;

        const getComparableName = (row: ApplicationRow) => {
            const last = toStringOrEmpty(row.last_name).trim().toLowerCase();
            const first = toStringOrEmpty(row.first_name).trim().toLowerCase();
            const middle = toStringOrEmpty(row.middle_name).trim().toLowerCase();
            const combined = [last, first, middle].filter((part) => part !== '').join('\u0000');
            return combined.length > 0 ? combined : null;
        };

        const getComparablePoints = (value: ApplicationRow['final_total_points']) =>
            typeof value === 'number' && Number.isFinite(value) ? value : null;

        const getComparableDate = (value: ApplicationRow['created_at']) => {
            if (!value) {
                return null;
            }

            const timestamp = new Date(value).getTime();
            return Number.isFinite(timestamp) ? timestamp : null;
        };

        const sorted = [...rows];
        sorted.sort((a, b) => {
            if (actionSort) {
                const aValidated = Boolean(a.latest_validation);
                const bValidated = Boolean(b.latest_validation);

                if (aValidated !== bValidated) {
                    if (actionSort === 'validated') {
                        return aValidated ? -1 : 1;
                    }

                    return aValidated ? 1 : -1;
                }
            }

            if (nameSort) {
                const aName = getComparableName(a);
                const bName = getComparableName(b);

                if (aName !== null && bName !== null && aName !== bName) {
                    return nameSort === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
                }

                if (aName === null && bName !== null) {
                    return 1;
                }

                if (aName !== null && bName === null) {
                    return -1;
                }
            }

            if (rankSort) {
                const aRank = getComparableRank(a.rank);
                const bRank = getComparableRank(b.rank);

                if (aRank !== null && bRank !== null && aRank !== bRank) {
                    return rankSort === 'asc' ? aRank - bRank : bRank - aRank;
                }

                if (aRank === null && bRank !== null) {
                    return 1;
                }

                if (aRank !== null && bRank === null) {
                    return -1;
                }
            }

            if (pointsSort) {
                const aPoints = getComparablePoints(a.final_total_points);
                const bPoints = getComparablePoints(b.final_total_points);

                if (aPoints !== null && bPoints !== null && aPoints !== bPoints) {
                    return pointsSort === 'asc' ? aPoints - bPoints : bPoints - aPoints;
                }

                if (aPoints === null && bPoints !== null) {
                    return 1;
                }

                if (aPoints !== null && bPoints === null) {
                    return -1;
                }
            }

            if (submittedSort) {
                const aSubmitted = getComparableDate(a.created_at);
                const bSubmitted = getComparableDate(b.created_at);

                if (aSubmitted !== null && bSubmitted !== null && aSubmitted !== bSubmitted) {
                    return submittedSort === 'asc' ? aSubmitted - bSubmitted : bSubmitted - aSubmitted;
                }

                if (aSubmitted === null && bSubmitted !== null) {
                    return 1;
                }

                if (aSubmitted !== null && bSubmitted === null) {
                    return -1;
                }
            }

            return 0;
        });

        return sorted;
    }, [actionSort, nameSort, pointsSort, rankSort, rows, submittedSort]);

    const commitSearch = (value: string) => {
        const trimmed = value.trim();
        const targetPage = 1;
        const shouldRefetchImmediately = trimmed === search && page === targetPage;

        setPage(targetPage);
        setSearch(trimmed);

        if (shouldRefetchImmediately) {
            void fetchData(targetPage, trimmed, perPage);
        }
    };

    useEffect(() => {
        if (!ready) {
            return;
        }

        fetchData(page, search, perPage);
    }, [fetchData, page, perPage, search, ready]);

    const formatApplicantName = (row?: ApplicationRow | null) => {
        if (!row) return '—';
        const givenNames = [row.first_name, row.middle_name]
            .filter((part) => part && String(part).trim() !== '')
            .join(' ');
        const base = givenNames
            ? `${row.last_name.toUpperCase()}, ${givenNames}`
            : row.last_name.toUpperCase();
        const suffix = row.name_extension ? ` ${row.name_extension}` : '';
        return `${base}${suffix}`.trim();
    };

    useEffect(() => {
        document.documentElement.classList.add('overflow-x-hidden');
        document.body.classList.add('overflow-x-hidden');
        return () => {
            document.documentElement.classList.remove('overflow-x-hidden');
            document.body.classList.remove('overflow-x-hidden');
        };
    }, []);

    const resetValidationState = () => {
        setValidationRow(null);
        setValidationForm({ ...EMPTY_VALIDATION_FORM });
        setValidationErrors({});
        setValidationSubmitting(false);
        setClearingValidation(false);
        setSiblingsPopoverOpen(false);
        setRankPopoverOpen(false);
        setSelectedId(null);
    };

    const openValidationDialog = (row: ApplicationRow) => {
        setValidationRow(row);
        setSelectedId(row.id);
        setValidationForm({
            document_status: row.latest_validation?.document_status ?? '',
            no_siblings: row.latest_validation?.no_siblings ? String(row.latest_validation.no_siblings) : '',
            initial_rank: row.latest_validation?.initial_rank ?? '',
            remarks: getAutoRemarksForRow(row),
        });
        setValidationErrors({});
        setValidationSubmitting(false);
        setClearingValidation(false);
        setSiblingsPopoverOpen(false);
        setRankPopoverOpen(false);
        setValidationDialogOpen(true);
    };

    const autoRemarks = useMemo(() => getAutoRemarksForRow(validationRow), [validationRow]);

    useEffect(() => {
        if (!validationDialogOpen) {
            return;
        }

        setValidationForm((prev) =>
            prev.remarks === autoRemarks
                ? prev
                : {
                    ...prev,
                    remarks: autoRemarks,
                }
        );
    }, [autoRemarks, validationDialogOpen]);

    const handleValidationDialogChange = (open: boolean) => {
        setValidationDialogOpen(open);
        if (!open) {
            resetValidationState();
        }
    };

    const handleValidationSubmit = async () => {
        if (!validationRow) return;

        const nextErrors: { document_status?: string; no_siblings?: string; initial_rank?: string } = {};
        if (!validationForm.document_status.trim()) {
            nextErrors.document_status = 'Document status is required.';
        }
        if (!validationForm.no_siblings) {
            nextErrors.no_siblings = 'Select the number of siblings.';
        }
        if (!validationForm.initial_rank) {
            nextErrors.initial_rank = 'Select the initial rank.';
        }
        setValidationErrors(nextErrors);
        if (Object.keys(nextErrors).length > 0) {
            return;
        }

        setValidationSubmitting(true);
        try {
            const payload = {
                cmsp_id: validationRow.id,
                document_status: validationForm.document_status.trim(),
                no_siblings: Number(validationForm.no_siblings),
                initial_rank: validationForm.initial_rank,
                remarks: autoRemarks,
            };

            const res = await fetch(getValidationStoreUrl(), {
                method: 'POST',

                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),      // ← use cookie token
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',

                body: JSON.stringify(payload),
            });

            let json: any = null;
            try {
                json = await res.json();
            } catch (err) {
                json = null;
            }

            const contentType = res.headers.get('content-type') || '';

            if (!res.ok) {
                if (json?.errors) {
                    const serverErrors: { document_status?: string; no_siblings?: string; initial_rank?: string } = {};
                    if (json.errors.document_status?.length) {
                        serverErrors.document_status = json.errors.document_status[0];
                    }
                    if (json.errors.no_siblings?.length) {
                        serverErrors.no_siblings = json.errors.no_siblings[0];
                    }
                    if (json.errors.initial_rank?.length) {
                        serverErrors.initial_rank = json.errors.initial_rank[0];
                    }
                    setValidationErrors((prev) => ({ ...prev, ...serverErrors }));
                }
                throw new Error(json?.message ?? 'Failed to save validation.');
            }

            toast.success(json?.message ?? 'Application validation saved successfully.');

            const savedValidation = json?.validation ?? null;
            const targetRowId = savedValidation?.cmsp_id ?? validationRow.id;
            if (savedValidation) {
                setValidationRow((prev) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        latest_validation: savedValidation,
                    };
                });

                setRows((prevRows) =>
                    prevRows.map((row) =>
                        row.id === targetRowId
                            ? {
                                ...row,
                                latest_validation: savedValidation,
                            }
                            : row,
                    ),
                );

                setValidationForm({
                    document_status: savedValidation.document_status ?? '',
                    no_siblings:
                        typeof savedValidation.no_siblings === 'number'
                            ? String(savedValidation.no_siblings)
                            : '',
                    initial_rank: savedValidation.initial_rank ?? '',
                    remarks: savedValidation.remarks ?? '',
                });
            } else {
                setValidationForm({
                    document_status: payload.document_status,
                    no_siblings: String(payload.no_siblings),
                    initial_rank: payload.initial_rank,
                    remarks: payload.remarks ?? '',
                });
            }

            setValidationErrors({});

            await fetchData(page, search, perPage);
            setSelectedId(targetRowId);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save validation.';
            toast.error(message);
        } finally {
            setValidationSubmitting(false);
        }
    };

    const handleClearValidation = async () => {
        if (!validationRow?.latest_validation) {
            return;
        }

        setClearingValidation(true);
        try {
            const res = await fetch(getValidationDestroyUrl(validationRow.latest_validation.id), {
                method: 'DELETE',
                // AFTER
                headers: {
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),      // ← use cookie token
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',

            });

            let json: any = null;
            try {
                json = await res.json();
            } catch (err) {
                json = null;
            }

            if (!res.ok) {
                throw new Error(json?.message ?? 'Failed to clear validation.');
            }

            toast.success(json?.message ?? 'Application validation cleared.');

            const targetRowId = validationRow.id;
            setValidationRow((prev) => (prev ? { ...prev, latest_validation: null } : prev));
            setRows((prevRows) =>
                prevRows.map((row) =>
                    row.id === targetRowId
                        ? {
                            ...row,
                            latest_validation: null,
                        }
                        : row,
                ),
            );
            setValidationForm({ ...EMPTY_VALIDATION_FORM });
            setValidationErrors({});
            setSiblingsPopoverOpen(false);
            setRankPopoverOpen(false);

            setSelectedId(targetRowId);
            fetchData(page, search, perPage).then(() => {
                setSelectedId(targetRowId);
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to clear validation.';
            toast.error(message);
        } finally {
            setClearingValidation(false);
        }
    };

    const fmtDate = (iso: string) =>
        new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    const latestValidation = validationRow?.latest_validation ?? null;
    const validationStatusTone = latestValidation
        ? {
            container:
                'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/30 dark:text-emerald-300',
            badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300',
        }
        : {
            container:
                'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-200',
            badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
        };
    const checkedByLabel = latestValidation?.checker?.name ?? '—';
    const dateCheckedLabel = latestValidation?.created_at ? fmtDate(latestValidation.created_at) : '—';

    const handleExport = useCallback(async () => {
        try {
            setExporting(true);
            const res = await fetch(buildExportUrl(search), {
                headers: {
                    Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                },
            });
            if (!res.ok) {
                throw new Error('Failed to export');
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);

            const disposition = res.headers.get('Content-Disposition');
            let filename = `cmspranklist-${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}.xlsx`;
            if (disposition) {
                const match = /filename\*?="?([^";]+)"?/i.exec(disposition);
                if (match && match[1]) {
                    try {
                        filename = decodeURIComponent(match[1].replace(/"/g, ''));
                    } catch (err) {
                        filename = match[1].replace(/"/g, '');
                    }
                }
            }

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error(error);
            if (typeof window !== 'undefined') {
                window.alert('Failed to export rank list. Please try again.');
            }
        } finally {
            setExporting(false);
        }
    }, [buildExportUrl, search]);

    return (

        <div className="mt-5 px-4 py-4 w-full max-w-full min-w-0">

            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                {/* Left: search */}
                <div className="flex items-center gap-2">


                    <div className="relative">
                        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search by name, tracking no, LRN, or email…"
                            className="h-9 w-72 rounded-md border border-zinc-300 bg-white pl-8 pr-10 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    commitSearch(e.currentTarget.value);
                                }
                            }}
                        />
                        {searchInput && (
                            <button
                                type="button"
                                aria-label="Clear search"
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:hover:bg-zinc-800"
                                onClick={() => {
                                    setSearchInput('');
                                    commitSearch('');
                                }}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>


                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="group relative overflow-hidden bg-[#1e3c73] hover:bg-[#1a3565] text-white px-3 py-1.5 rounded-md transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-[#1e3c73]"
                        onClick={() => commitSearch(searchInput)}
                    >
                        <Search className="h-3.5 w-3.5 transition-transform group-hover:scale-110 text-white" />
                    </Button>
          
                </div>



                {/* Right: per-page */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page</span>
                    <select
                        className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900"
                        value={perPage}
                        onChange={(e) => setPerPage(Number(e.target.value))}
                    >
                        {[10, 20, 50].map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="
              group relative overflow-hidden
              bg-[#1e3c73] hover:bg-[#1a3565]
              text-white hover:text-white
              px-3 py-1.5 rounded-md
              transition-all duration-300
              focus:outline-none focus:ring-1 focus:ring-[#1e3c73]
              flex items-center gap-1.5
            "
                        onClick={handleExport}
                        disabled={exporting}
                        aria-busy={exporting}
                    >
                        {exporting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
                        ) : (
                            <FileSpreadsheet className="h-3.5 w-3.5 transition-transform group-hover:scale-110 text-white" />
                        )}
                        <span className="text-white group-hover:text-white">{exporting ? 'Exporting…' : 'Export'}</span>
                    </Button>
                </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 w-full max-w-full">
                <div className="overflow-x-auto w-full max-w-full min-w-0">
                    <table className="min-w-full w-max table-auto text-left text-sm
                        [&>tbody>tr>td]:break-words
                        [&>tbody>tr>td]:align-top
                        [&>tbody>tr>td]:max-w-[240px]">
                        <thead className="bg-zinc-50 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300
                          [&>tr>th]:whitespace-normal [&>tr>th]:break-words">
                            <tr className="[&>th]:whitespace-nowrap">
                                <th className="px-3 py-2 font-semibold">No</th>
                                <th className="px-3 py-2 font-semibold min-w-[160px]">Tracking No</th>
                                <th className="px-3 py-2 font-semibold">LRN</th>
                                <th className="px-3 py-2 font-semibold min-w-[240px]">Email</th>
                                <th className="px-3 py-2 font-semibold">Contact #</th>
                                <th className="px-3 py-2 font-semibold min-w-[160px]">
                                    <button
                                        type="button"
                                        onClick={toggleNameSort}
                                        className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-[#1e3c73] dark:hover:text-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3c73]/40 rounded"
                                        aria-pressed={nameSort !== null}
                                        title={
                                            nameSort === 'asc'
                                                ? 'Sorting by name (A to Z). Click to show Z to A.'
                                                : nameSort === 'desc'
                                                    ? 'Sorting by name (Z to A). Click to reset ordering.'
                                                    : 'Sort by name. Click to show A to Z.'
                                        }
                                    >
                                        <span>Name</span>
                                        {nameSort === 'asc' ? (
                                            <ChevronUp className="h-4 w-4" aria-hidden="true" />
                                        ) : nameSort === 'desc' ? (
                                            <ChevronDown className="h-4 w-4" aria-hidden="true" />
                                        ) : (
                                            <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-3 py-2 font-semibold">Name Ext.</th>
                                <th className="px-3 py-2 font-semibold">Maiden Name</th>
                                <th className="px-3 py-2 font-semibold">Sex</th>
                                <th className="px-3 py-2 font-semibold">Birthdate</th>
                                <th className="px-3 py-2 font-semibold">Age</th>
                                <th className="px-3 py-2 font-semibold">Ethnicity</th>
                                <th className="px-3 py-2 font-semibold">Religion</th>

                                <th className="px-3 py-2 font-semibold  min-w-[300px]">Province/Municipality</th>
                                <th className="px-3 py-2 font-semibold  min-w-[200px]">District</th>
                                <th className="px-3 py-2 font-semibold">Barangay</th>
                                <th className="px-3 py-2 font-semibold">Purok/Street</th>
                                <th className="px-3 py-2 font-semibold">ZIP</th>

                                <th className="px-3 py-2 font-semibold">BARMM Province</th>
                                <th className="px-3 py-2 font-semibold">BARMM Municipality</th>
                                <th className="px-3 py-2 font-semibold">BARMM Barangay</th>
                                <th className="px-3 py-2 font-semibold">BARMM Street</th>
                                <th className="px-3 py-2 font-semibold">BARMM ZIP</th>

                                <th className="px-3 py-2 font-semibold min-w-[400px]">Intended School</th>
                                <th className="px-3 py-2 font-semibold">School Type</th>
                                <th className="px-3 py-2 font-semibold">Other School</th>
                                <th className="px-3 py-2 font-semibold">Year Level</th>
                                <th className="px-3 py-2 font-semibold min-w-[400px]">Course</th>
                                <th className="px-3 py-2 font-semibold min-w-[300px]">GAD StuFAPs</th>

                                <th className="px-3 py-2 font-semibold min-w-[400px]">SHS School Name</th>
                                <th className="px-3 py-2 font-semibold">SHS School Address</th>
                                <th className="px-3 py-2 font-semibold">SHS School Type</th>

                                <th className="px-3 py-2 font-semibold">Father</th>
                                <th className="px-3 py-2 font-semibold">Father Occupation</th>
                                <th className="px-3 py-2 font-semibold">Father Income (monthly)</th>
                                <th className="px-3 py-2 font-semibold">Father Income (yearly)</th>

                                <th className="px-3 py-2 font-semibold">Mother</th>
                                <th className="px-3 py-2 font-semibold">Mother Occupation</th>
                                <th className="px-3 py-2 font-semibold">Mother Income (monthly)</th>
                                <th className="px-3 py-2 font-semibold">Mother Income (yearly)</th>

                                <th className="px-3 py-2 font-semibold  min-w-[200px]">Guardian</th>
                                <th className="px-3 py-2 font-semibold">Guardian Occupation</th>
                                <th className="px-3 py-2 font-semibold">Guardian Income (monthly)</th>

                                <th className="px-3 py-2 font-semibold">GWA G12 S1</th>
                                <th className="px-3 py-2 font-semibold">GWA G12 S2</th>

                                <th className="px-3 py-2 font-semibold min-w-[300px]">Special Groups</th>

                                <th className="px-3 py-2 font-semibold min-w-[300px]">Files</th>

                                <th className="px-3 py-2 font-semibold min-w-[140px]">AY</th>
                                <th className="px-3 py-2 font-semibold">Deadline</th>
                                <th className="px-3 py-2 font-semibold min-w-[180px]">
                                    <button
                                        type="button"
                                        onClick={togglePointsSort}
                                        className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-[#1e3c73] dark:hover:text-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3c73]/40 rounded"
                                        aria-pressed={pointsSort !== null}
                                        title={
                                            pointsSort === 'asc'
                                                ? 'Sorting by final total points (lowest first). Click to show highest first.'
                                                : pointsSort === 'desc'
                                                    ? 'Sorting by final total points (highest first). Click to reset ordering.'
                                                    : 'Sort by final total points. Click to show lowest first.'
                                        }
                                    >
                                        <span>Final Total Points</span>
                                        {pointsSort === 'asc' ? (
                                            <ChevronUp className="h-4 w-4" aria-hidden="true" />
                                        ) : pointsSort === 'desc' ? (
                                            <ChevronDown className="h-4 w-4" aria-hidden="true" />
                                        ) : (
                                            <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-3 py-2 font-semibold">
                                    <button
                                        type="button"
                                        onClick={toggleRankSort}
                                        className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-[#1e3c73] dark:hover:text-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3c73]/40 rounded"
                                        aria-pressed={rankSort !== null}
                                        title={
                                            rankSort === 'asc'
                                                ? 'Sorting by rank (lowest number first). Click to show highest rank first.'
                                                : rankSort === 'desc'
                                                    ? 'Sorting by rank (highest number first). Click to reset ordering.'
                                                    : 'Sort by rank. Click to show lowest rank first.'
                                        }
                                    >
                                        <span>Rank</span>
                                        {rankSort === 'asc' ? (
                                            <ChevronUp className="h-4 w-4" aria-hidden="true" />
                                        ) : rankSort === 'desc' ? (
                                            <ChevronDown className="h-4 w-4" aria-hidden="true" />
                                        ) : (
                                            <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-3 py-2 font-semibold min-w-[190px]">
                                    <button
                                        type="button"
                                        onClick={toggleSubmittedSort}
                                        className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-[#1e3c73] dark:hover:text-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3c73]/40 rounded"
                                        aria-pressed={submittedSort !== null}
                                        title={
                                            submittedSort === 'asc'
                                                ? 'Sorting by submission date (oldest first). Click to show newest first.'
                                                : submittedSort === 'desc'
                                                    ? 'Sorting by submission date (newest first). Click to reset ordering.'
                                                    : 'Sort by submission date. Click to show oldest submissions first.'
                                        }
                                    >
                                        <span>Submitted</span>
                                        {submittedSort === 'asc' ? (
                                            <ChevronUp className="h-4 w-4" aria-hidden="true" />
                                        ) : submittedSort === 'desc' ? (
                                            <ChevronDown className="h-4 w-4" aria-hidden="true" />
                                        ) : (
                                            <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-3 py-2 font-semibold sticky right-0 z-20 bg-zinc-50 dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800">
                                    <button
                                        type="button"
                                        onClick={toggleActionSort}
                                        className="flex items-center gap-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:text-[#1e3c73] dark:hover:text-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3c73]/40 rounded"
                                        aria-pressed={actionSort !== null}
                                        title={
                                            actionSort === 'validated'
                                                ? 'Sorting by validation status (validated first). Click to show pending first.'
                                                : actionSort === 'pending'
                                                    ? 'Sorting by validation status (pending first). Click to reset ordering.'
                                                    : 'Sort by validation status. Click to show validated applications first.'
                                        }
                                    >
                                        <span>Action</span>
                                        {actionSort === 'validated' ? (
                                            <ChevronUp className="h-4 w-4" aria-hidden="true" />
                                        ) : actionSort === 'pending' ? (
                                            <ChevronDown className="h-4 w-4" aria-hidden="true" />
                                        ) : (
                                            <ChevronsUpDown className="h-4 w-4" aria-hidden="true" />
                                        )}
                                    </button>
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                                        {Array.from({ length: COLS }).map((__, j) => (
                                            <td key={j} className="px-3 py-2">
                                                <div className="h-4 w-full max-w-[220px] animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : displayRows.length === 0 ? (
                                <tr className="border-t border-zinc-100 dark:border-zinc-800">
                                    <td className="px-3 py-6 text-left text-zinc-600 dark:text-zinc-300" colSpan={COLS}>
                                        <div className="flex flex-col items-start gap-3">
                                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                                <UserX className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-gray-500 dark:text-gray-400 font-medium">No applications found.</p>
                                                <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your search criteria</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                displayRows.map((r, idx) => (
                                    <tr
                                        key={r.id}
                                        tabIndex={0}
                                        role="row"
                                        aria-selected={selectedId === r.id}
                                        onClick={() => setSelectedId(prev => (prev === r.id ? null : r.id))}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                setSelectedId(prev => (prev === r.id ? null : r.id));
                                            }
                                        }}
                                        className={cn(
                                            'group border-t border-zinc-100 dark:border-zinc-800 cursor-auto transition-all',
                                            isDisqualifiedRemarks(r.latest_validation?.remarks)
                                                ? 'bg-red-100/70 dark:bg-red-900/25 hover:bg-red-100 dark:hover:bg-red-900/35'
                                                : 'hover:bg-zinc-50 dark:hover:bg-zinc-900/40',
                                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500',
                                            selectedId === r.id &&
                                            (isDisqualifiedRemarks(r.latest_validation?.remarks)
                                                ? 'bg-red-200/80 dark:bg-red-900/45 ring-2 ring-inset ring-red-400/60 dark:ring-red-700/60'
                                                : 'bg-blue-100/80 dark:bg-blue-900/50 ring-2 ring-inset ring-blue-400/60 dark:ring-blue-700/60')
                                        )}
                                    >
                                        <td
                                            className={cn(
                                                'px-3 py-2',
                                                selectedId === r.id && 'border-l-4 border-blue-500 pl-2 dark:border-blue-600'
                                            )}
                                        >
                                            {idx + 1 + (page - 1) * perPage}
                                        </td>

                                        <td className="px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={cn(
                                                        'inline-block rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800 ',
                                                        r.latest_validation
                                                            ? 'bg-emerald-100 text-emerald-700  dark:bg-emerald-900/40 dark:text-emerald-300'
                                                            : 'text-amber-600'
                                                    )}
                                                >
                                                    {r.tracking_no}
                                                </span>
                                                {r.tracking_no ? (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-amber-700 transition-colors hover:text-amber-900 hover:bg-amber-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 dark:text-amber-200 dark:hover:text-amber-100 dark:hover:bg-amber-900/40"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            void handleCopyTracking(r.tracking_no);
                                                        }}
                                                        aria-label={`Copy tracking number ${r.tracking_no}`}
                                                        title="Copy tracking number"
                                                    >
                                                        <Copy className="h-4 w-4" aria-hidden="true" />
                                                    </Button>
                                                ) : null}
                                            </div>
                                        </td>

                                        <td className="px-3 py-2">{r.lrn}</td>

                                        <td className="px-3 py-2 relative" title={r.email}>
                                            <div className="flex items-center gap-2 max-w-[280px]">
                                                <TruncateCell value={r.email} max={20} />
                                            </div>
                                        </td>

                                        <td className="px-3 py-2" title={r.contact_number}>
                                            <TruncateCell value={r.contact_number} max={20} />
                                        </td>

                                        <td className="px-3 py-2">
                                            {r.last_name}, {r.first_name} {r.middle_name ?? ''} {r.name_extension ?? ''}
                                        </td>

                                        <td className="px-3 py-2">{r.name_extension ?? '—'}</td>
                                        <td className="px-3 py-2">{r.maiden_name ?? '—'}</td>
                                        <td className="px-3 py-2 capitalize">{r.sex}</td>
                                        <td className="px-3 py-2">{new Date(r.birthdate).toLocaleDateString()}</td>
                                        <td className="px-3 py-2">{r.age ?? '—'}</td>
                                        <td className="px-3 py-2 capitalize">{r.ethnicity_name ?? r.ethnicity_id}</td>
                                        <td className="px-3 py-2 capitalize">{r.religion_name ?? r.religion_id}</td>

                                        <td className="px-3 py-2" title={r.province_municipality_name ?? String(r.province_municipality ?? '—')}>
                                            <TruncateCell value={r.province_municipality_name ?? r.province_municipality ?? '—'} max={34} />
                                        </td>
                                        <td className="px-3 py-2">{r.district_name ?? r.district ?? '—'}</td>
                                        <td className="px-3 py-2">{r.barangay ?? '—'}</td>

                                        <td className="px-3 py-2" title={r.purok_street ?? '—'}>
                                            <TruncateCell value={r.purok_street ?? '—'} max={24} />
                                        </td>

                                        <td className="px-3 py-2">{r.zip_code ?? '—'}</td>

                                        <td className="px-3 py-2">{r.barmm_province ?? '—'}</td>
                                        <td className="px-3 py-2">{r.barmm_municipality ?? '—'}</td>
                                        <td className="px-3 py-2">{r.barmm_barangay ?? '—'}</td>

                                        <td className="px-3 py-2" title={r.barmm_purok_street ?? '—'}>
                                            <TruncateCell value={r.barmm_purok_street ?? '—'} max={24} />
                                        </td>

                                        <td className="px-3 py-2">{r.barmm_zip_code ?? '—'}</td>

                                        <td className="px-3 py-2" title={r.intended_school_name ?? String(r.intended_school)}>
                                            <TruncateCell value={r.intended_school_name ?? r.intended_school} max={32} />
                                        </td>

                                        <td className="px-3 py-2">
                                            <span
                                                className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${r.school_type === 'Public'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : r.school_type === 'LUC'
                                                        ? 'bg-amber-100 text-amber-800'
                                                        : 'bg-purple-100 text-purple-800'
                                                    }`}
                                            >
                                                {r.school_type}
                                            </span>
                                        </td>

                                        <td className="px-3 py-2" title={r.other_school ?? '—'}>
                                            <TruncateCell value={r.other_school ?? '—'} max={26} />
                                        </td>

                                        <td className="px-3 py-2">{r.year_level}</td>

                                        <td className="px-3 py-2" title={r.course_name ?? String(r.course)}>
                                            <TruncateCell value={r.course_name ?? r.course} max={32} />
                                        </td>

                                        <td className="px-3 py-2" title={r.gad_stufaps_course ?? '—'}>
                                            <TruncateCell value={r.gad_stufaps_course ?? '—'} max={28} />
                                        </td>

                                        <td className="px-3 py-2" title={r.shs_name}>
                                            <TruncateCell value={r.shs_name} max={28} />
                                        </td>

                                        <td className="px-3 py-2" title={r.shs_address}>
                                            <TruncateCell value={r.shs_address} max={40} />
                                        </td>

                                        <td className="px-3 py-2" title={r.shs_school_type}>
                                            <TruncateCell value={r.shs_school_type} max={40} />
                                        </td>

                                        <td className="px-3 py-2">{r.father_name ?? '—'}</td>

                                        <td className="px-3 py-2" title={r.father_occupation ?? '—'}>
                                            <TruncateCell value={r.father_occupation ?? '—'} max={24} />
                                        </td>

                                        <td className="px-3 py-2">{r.father_income_monthly ?? '—'}</td>
                                        <td className="px-3 py-2">{r.father_income_yearly_bracket ?? '—'}</td>

                                        <td className="px-3 py-2">{r.mother_name ?? '—'}</td>

                                        <td className="px-3 py-2" title={r.mother_occupation ?? '—'}>
                                            <TruncateCell value={r.mother_occupation ?? '—'} max={24} />
                                        </td>

                                        <td className="px-3 py-2">{r.mother_income_monthly ?? '—'}</td>
                                        <td className="px-3 py-2">{r.mother_income_yearly_bracket ?? '—'}</td>

                                        <td className="px-3 py-2">{r.guardian_name ?? '—'}</td>

                                        <td className="px-3 py-2" title={r.guardian_occupation ?? '—'}>
                                            <TruncateCell value={r.guardian_occupation ?? '—'} max={24} />
                                        </td>

                                        <td className="px-3 py-2">{r.guardian_income_monthly ?? '—'}</td>

                                        <td className="px-3 py-2">
                                            <span className="inline-block rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                                                {r.gwa_g12_s1}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className="inline-block rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                                                {r.gwa_g12_s2}
                                            </span>
                                        </td>

                                        <td className="px-3 py-2" title={r.special_groups?.length ? r.special_groups.join(', ') : '—'}>
                                            <TruncateCell value={r.special_groups?.length ? r.special_groups.join(', ') : '—'} max={40} />
                                        </td>

                                        <td className="px-3 py-2 align-top max-w-[260px]" title="Application attachments">
                                            {renderAttachments(r)}
                                        </td>

                                        <td className="px-3 py-2">
                                            <span className="inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                                                {r.academic_year}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className="inline-block rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                                                {new Date(r.deadline).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            {typeof r.final_total_points === 'number'
                                                ? r.final_total_points.toFixed(2)
                                                : '—'}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                            {typeof r.rank === 'number' ? r.rank : '—'}
                                        </td>
                                        <td className="px-3 py-2">{fmtDate(r.created_at)}</td>
                                        <td
                                            className={cn(
                                                'px-3 py-2 sticky right-0 z-20 border-l border-zinc-200 dark:border-zinc-800',
                                                selectedId === r.id
                                                    ? (isDisqualifiedRemarks(r.latest_validation?.remarks)
                                                        ? 'bg-red-200 dark:bg-red-900/70'
                                                        : 'bg-blue-100 dark:bg-blue-900')
                                                    : (isDisqualifiedRemarks(r.latest_validation?.remarks)
                                                        ? 'bg-red-100/70 dark:bg-red-900/25 group-hover:bg-red-100 dark:group-hover:bg-red-900/35'
                                                        : 'bg-white dark:bg-zinc-950 group-hover:bg-zinc-50 dark:group-hover:bg-zinc-900/40')
                                            )}
                                        >
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className={cn(
                                                    'px-3 py-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3c73]/40 flex items-center justify-center',
                                                    r.latest_validation
                                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60'
                                                        : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                                                )}
                                                onClick={() => openValidationDialog(r)}
                                                title={r.latest_validation ? 'View validation' : 'Validate application'}
                                            >
                                                {r.latest_validation ? (
                                                    <Check className="h-4 w-4" />
                                                ) : (
                                                    <SquarePen className="h-4 w-4" />
                                                )}
                                                <span className="sr-only">
                                                    {r.latest_validation ? 'View validation' : 'Validate application'}
                                                </span>
                                            </Button>
                                        </td>

                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                </div>

                <Dialog open={validationDialogOpen} onOpenChange={handleValidationDialogChange}>
                    <DialogContent
                        ref={dialogContentRef}
                        className="w-[92vw] sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl overflow-visible rounded-2xl border border-zinc-200/70 dark:border-zinc-800/70 bg-white/95 dark:bg-zinc-950/80 backdrop-blur-md shadow-2xl ring-1 ring-[#1e3c73]/10"
                        onInteractOutside={(e) => {
                            e.preventDefault();
                        }}
                    >
                        <DialogHeader className="space-y-2 pb-4 border-b border-zinc-200/70 dark:border-zinc-800/70">
                            <div className=" py-1 text-[22px] font-semibold tracking-wide text-[#1e3c73]">
                                Validate Application {" "}
                                <span className="rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 px-2.5 py-1 text-xs font-medium">
                                    Tracking: {validationRow?.tracking_no ?? '—'}
                                </span>
                            </div>
                            <DialogDescription className="text-sm text-zinc-600 dark:text-zinc-400">
                                Review the applicant details and record the validation outcome.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-5">


                            <div
                                className={cn(
                                    'rounded-lg border px-4 py-3 text-sm transition-colors',
                                    validationStatusTone.container,
                                )}
                            >
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                    <div className="grid gap-2">
                                        <span className="text-xs font-semibold uppercase tracking-wide opacity-80">
                                            Validation status
                                        </span>
                                        <span
                                            className={cn(
                                                'inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-semibold',
                                                validationStatusTone.badge,
                                            )}
                                        >
                                            {latestValidation ? 'Validated' : 'Pending'}
                                        </span>
                                    </div>
                                    <div className="grid gap-3 text-xs sm:text-right">
                                        <div className="grid gap-1">
                                            <span className="font-semibold uppercase tracking-wide opacity-80">
                                                Checked by
                                            </span>
                                            <span className="text-sm font-semibold">
                                                {checkedByLabel}
                                            </span>
                                        </div>
                                        <div className="grid gap-1">
                                            <span className="font-semibold uppercase tracking-wide opacity-80">
                                                Date checked
                                            </span>
                                            <span className="text-sm font-semibold">
                                                {dateCheckedLabel}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-wrap  gap-2">

                                <span className=" uppercase  dark:text-zinc-200  py-1 text-[18px] text-xs text-[#1e3c73] font-medium">
                                    {formatApplicantName(validationRow)}
                                </span>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="validation-document-status">Status of Documentary Requirements</Label>
                                <Input
                                    id="validation-document-status"
                                    value={validationForm.document_status}
                                    onChange={(event) => {
                                        const value = event.target.value;
                                        setValidationForm((prev) => ({ ...prev, document_status: value }));
                                        if (validationErrors.document_status) {
                                            setValidationErrors((prev) => ({ ...prev, document_status: undefined }));
                                        }
                                    }}
                                    placeholder="e.g. Complete"
                                    aria-invalid={validationErrors.document_status ? 'true' : 'false'}
                                />
                                {validationErrors.document_status && (
                                    <p className="text-xs text-red-600">{validationErrors.document_status}</p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label>No. of Siblings</Label>
                                <Popover open={siblingsPopoverOpen} onOpenChange={setSiblingsPopoverOpen} modal={false} >
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={siblingsPopoverOpen}
                                            className={cn(
                                                'justify-between',
                                                !validationForm.no_siblings && 'text-muted-foreground'
                                            )}
                                        >
                                            {validationForm.no_siblings
                                                ? `${validationForm.no_siblings} ${Number(validationForm.no_siblings) === 1 ? 'sibling' : 'siblings'}`
                                                : 'Select siblings'}
                                            <ChevronDown className="ml-2 h-4 w-4 opacity-60" />
                                        </Button>
                                    </PopoverTrigger>
                                    <InDialogPopoverContent
                                        container={dialogContentRef.current}
                                        align="start"
                                        sideOffset={8}
                                    >
                                        <Command>
                                            <CommandInput placeholder="Search count..." />
                                            <CommandList>
                                                <CommandEmpty>No results found.</CommandEmpty>
                                                <CommandGroup>
                                                    {SIBLING_OPTIONS.map((count) => {
                                                        const value = String(count);
                                                        return (
                                                            <CommandItem
                                                                key={value}
                                                                value={value}
                                                                onSelect={(currentValue) => {
                                                                    setValidationForm((prev) => ({ ...prev, no_siblings: currentValue }));
                                                                    setValidationErrors((prev) => ({ ...prev, no_siblings: undefined }));
                                                                    setSiblingsPopoverOpen(false);
                                                                }}
                                                            >
                                                                <Check className={cn('mr-2 h-4 w-4', validationForm.no_siblings === value ? 'opacity-100' : 'opacity-0')} />
                                                                {value}
                                                            </CommandItem>
                                                        );
                                                    })}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </InDialogPopoverContent>
                                </Popover>
                                {validationErrors.no_siblings && (
                                    <p className="text-xs text-red-600">{validationErrors.no_siblings}</p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label>Initial Rank</Label>
                                <Popover open={rankPopoverOpen} onOpenChange={setRankPopoverOpen} modal={false} >
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={rankPopoverOpen}
                                            className={cn(
                                                'justify-between',
                                                !validationForm.initial_rank && 'text-muted-foreground'
                                            )}
                                        >
                                            {validationForm.initial_rank || 'Select initial rank'}
                                            <ChevronDown className="ml-2 h-4 w-4 opacity-60" />
                                        </Button>
                                    </PopoverTrigger>
                                    <InDialogPopoverContent
                                        container={dialogContentRef.current}
                                        align="start"
                                        sideOffset={8}
                                    >
                                        <Command>
                                            <CommandInput placeholder="Search rank..." />
                                            <CommandList>
                                                <CommandEmpty>No results found.</CommandEmpty>
                                                <CommandGroup>
                                                    {INITIAL_RANK_OPTIONS.map((option) => {
                                                        const value = String(option);
                                                        return (
                                                            <CommandItem
                                                                key={value}
                                                                value={value}
                                                                onSelect={(currentValue) => {
                                                                    setValidationForm((prev) => ({ ...prev, initial_rank: currentValue }));
                                                                    setValidationErrors((prev) => ({ ...prev, initial_rank: undefined }));
                                                                    setRankPopoverOpen(false);
                                                                }}
                                                            >
                                                                <Check className={cn('mr-2 h-4 w-4', validationForm.initial_rank === value ? 'opacity-100' : 'opacity-0')} />
                                                                {value}
                                                            </CommandItem>
                                                        );
                                                    })}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </InDialogPopoverContent>
                                </Popover>
                                {validationErrors.initial_rank && (
                                    <p className="text-xs text-red-600">{validationErrors.initial_rank}</p>
                                )}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="validation-remarks">Remarks</Label>
                                <textarea
                                    id="validation-remarks"
                                    className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-200"
                                    value={validationForm.remarks}
                                    readOnly
                                    maxLength={2000}
                                    placeholder="Remarks are automatically computed"
                                />
                            </div>
                        </div>
                        <DialogFooter className="gap-2 sm:justify-between">
                            {validationRow?.latest_validation && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClearValidation}
                                    disabled={validationSubmitting || clearingValidation}
                                    className="border-red-300 text-red-700 bg-red-50/60 hover:text-red-900 hover:bg-red-100 dark:border-red-800 dark:text-red-300 dark:bg-red-900/20"
                                >
                                    {clearingValidation && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Clear Validation
                                </Button>
                            )}
                            <div className="flex flex-1 items-center justify-end gap-2">
                                <DialogClose asChild>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        disabled={validationSubmitting || clearingValidation}
                                    >
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="button"
                                    onClick={handleValidationSubmit}
                                    disabled={validationSubmitting || clearingValidation}
                                    className="bg-[#1e3c73] hover:bg-[#1a3565] text-white shadow-sm"
                                >
                                    {validationSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Validation
                                </Button>
                            </div>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Pagination bar */}
                <div className="flex items-center justify-between border-t border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
                    <div className="text-zinc-600 dark:text-zinc-400">
                        Page <span className="font-medium">{page}</span> of <span className="font-medium">{lastPage}</span> • {total.toLocaleString()} total
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={loading || page <= 1}
                            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                        >
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Prev
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={loading || page >= lastPage}
                            onClick={() => setPage((prev) => Math.min(lastPage, prev + 1))}
                        >
                            Next
                            <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div >
    );
}

import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { Search, ChevronLeft, ChevronRight, X, UserX, Accessibility, Baby, Globe, MoonStar, FileSpreadsheet } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

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
    sex: 'male' | 'female';


    ethnicity_id: number; ethnicity_name?: string;   // from e.label
    religion_id: number; religion_name?: string;    // from r.label
    province_municipality: number; province_municipality_name?: string; // "Municipality, Province"
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

    // misc
    special_groups: string[]; // make sure model casts to array
    consent: boolean;
    academic_year: string;
    deadline: string; // ISO date
    created_at: string; // ISO datetime
};

type ColumnDefinition = {
    key: string;
    label: string;
    className?: string;
    render?: (row: ApplicationRow) => ReactNode;
};

const currencyFormatter = new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: 0,
});

const gradeFormatter = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const formatCurrency = (value?: number | null) => {
    if (value === null || value === undefined) return '—';
    return currencyFormatter.format(value);
};

const formatGrade = (value?: number | null) => {
    if (value === null || value === undefined) return '—';
    return gradeFormatter.format(value);
};

const formatDateOnly = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });

const capitalizeOrFallback = (value?: string | number | null, fallback?: string | number | null) => {
    const resolved = value ?? fallback;
    if (resolved === null || resolved === undefined) return '—';
    return typeof resolved === 'string' ? resolved.charAt(0).toUpperCase() + resolved.slice(1) : resolved;
};

const renderColumnValue = (row: ApplicationRow, column: ColumnDefinition) => {
    if (column.render) {
        return column.render(row);
    }

    const rawValue = (row as Record<string, unknown>)[column.key];

    if (rawValue === null || rawValue === undefined || rawValue === '') {
        return '—';
    }

    return rawValue;
};


const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Home',
        href: '/dashboard',
    },
];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Home" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-visible">
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
                            <div className="text-2xl font-semibold tracking-tight">0</div>
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
                            <div className="text-2xl font-semibold tracking-tight">0</div>
                            <p className="text-xs text-muted-foreground">as of today</p>
                        </CardContent>
                    </Card>

                    {/* Ethnicity */}
                    <Card className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ethnicity</CardTitle>
                            <div className="rounded-full p-2 bg-zinc-100 dark:bg-zinc-900">
                                <Globe className="h-5 w-5 text-[#1e3c73]" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold tracking-tight">0</div>
                            <p className="text-xs text-muted-foreground">unique groups</p>
                        </CardContent>
                    </Card>

                    {/* Religion */}
                    <Card className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Religion</CardTitle>
                            <div className="rounded-full p-2 bg-zinc-100 dark:bg-zinc-900">
                                <MoonStar className="h-5 w-5 text-[#1e3c73]" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-semibold tracking-tight">0</div>
                            <p className="text-xs text-muted-foreground">registered</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen">
                    <div className="mx-auto max-w-[1280px] px-4">
                        <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                            <CmspsTable />
                        </div>
                    </div>
                </div>

            </div>
        </AppLayout>
    );
}


function CmspsTable() {
    const [rows, setRows] = useState<ApplicationRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState('');

    const buildUrl = useCallback((p: number, s: string, pp: number) => {
        const base = (window as any).route
            ? (window as any).route('cmsp-applications.index.json')
            : '/cmsp-applications/json';

        const u = new URL(base, window.location.origin);
        u.searchParams.set('page', String(p));
        u.searchParams.set('per_page', String(pp));
        u.searchParams.set('full', '1');            // 👈 ask for all columns
        if (s.trim()) u.searchParams.set('search', s.trim());
        return u.toString();
    }, []);


    const fetchData = useCallback(async (p = page, s = search, pp = perPage) => {
        setLoading(true);
        try {
            const res = await fetch(buildUrl(p, s, pp), { headers: { Accept: 'application/json' } });
            if (!res.ok) throw new Error('Failed to load');
            const json = await res.json();
            setRows(json.data ?? []);
            setTotal(json.meta?.total ?? 0);
            setLastPage(json.meta?.last_page ?? 1);
            setPage(json.meta?.current_page ?? p);
        } catch (e) {
            setRows([]);
            setTotal(0);
            setLastPage(1);
        } finally {
            setLoading(false);
        }
    }, [buildUrl, page, perPage, search]);

    useEffect(() => { fetchData(1, search, perPage); }, [perPage]); // refetch when perPage changes

    const fmtDate = (iso: string) =>
        new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    const columnGroups = [
        {
            title: 'Application',
            columns: [
                { key: 'tracking_no', label: 'Tracking No', className: 'min-w-[150px]' },
                { key: 'lrn', label: 'LRN' },
                {
                    key: 'incoming',
                    label: 'Status',
                    className: 'min-w-[120px]',
                    render: (row: ApplicationRow) => (
                        <Badge
                            variant={row.incoming ? 'secondary' : 'outline'}
                            className={row.incoming ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200' : 'text-zinc-600 dark:text-zinc-300'}
                        >
                            {row.incoming ? 'New submission' : 'Reviewed'}
                        </Badge>
                    ),
                },
            ],
        },
        {
            title: 'Contact',
            columns: [
                { key: 'email', label: 'Email', className: 'min-w-[180px]' },
                { key: 'contact_number', label: 'Contact #' },
            ],
        },
        {
            title: 'Personal Details',
            columns: [
                {
                    key: 'name',
                    label: 'Applicant Name',
                    className: 'min-w-[200px]',
                    render: (row: ApplicationRow) => (
                        <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-zinc-900 dark:text-zinc-100">
                                {row.last_name}, {row.first_name} {row.middle_name ?? ''}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {row.name_extension ?? '—'}{row.maiden_name ? ` • Maiden: ${row.maiden_name}` : ''}
                            </span>
                        </div>
                    ),
                },
                {
                    key: 'sex',
                    label: 'Sex',
                    render: (row: ApplicationRow) => (row.sex ? row.sex.charAt(0).toUpperCase() + row.sex.slice(1) : '—'),
                },
                {
                    key: 'birthdate',
                    label: 'Birthdate',
                    render: (row: ApplicationRow) => formatDateOnly(row.birthdate),
                },
                {
                    key: 'ethnicity_name',
                    label: 'Ethnicity',
                    render: (row: ApplicationRow) => capitalizeOrFallback(row.ethnicity_name, row.ethnicity_id),
                },
                {
                    key: 'religion_name',
                    label: 'Religion',
                    render: (row: ApplicationRow) => capitalizeOrFallback(row.religion_name, row.religion_id),
                },
            ],
        },
        {
            title: 'Primary Address',
            columns: [
                {
                    key: 'province_municipality_name',
                    label: 'Province / Municipality',
                    className: 'min-w-[190px]',
                    render: (row: ApplicationRow) => row.province_municipality_name ?? row.province_municipality ?? '—',
                },
                {
                    key: 'district_name',
                    label: 'District',
                    render: (row: ApplicationRow) => row.district_name ?? row.district ?? '—',
                },
                { key: 'barangay', label: 'Barangay' },
                { key: 'purok_street', label: 'Purok / Street' },
                { key: 'zip_code', label: 'ZIP' },
            ],
        },
        {
            title: 'BARMM Address',
            columns: [
                { key: 'barmm_province', label: 'Province' },
                { key: 'barmm_municipality', label: 'Municipality' },
                { key: 'barmm_barangay', label: 'Barangay' },
                { key: 'barmm_purok_street', label: 'Street' },
                { key: 'barmm_zip_code', label: 'ZIP' },
            ],
        },
        {
            title: 'Education Intent',
            columns: [
                {
                    key: 'intended_school_name',
                    label: 'Intended School',
                    className: 'min-w-[210px]',
                    render: (row: ApplicationRow) => row.intended_school_name ?? row.intended_school ?? '—',
                },
                { key: 'school_type', label: 'School Type' },
                { key: 'other_school', label: 'Other School' },
                { key: 'year_level', label: 'Year Level' },
                {
                    key: 'course_name',
                    label: 'Preferred Course',
                    className: 'min-w-[210px]',
                    render: (row: ApplicationRow) => row.course_name ?? row.course ?? '—',
                },
                { key: 'gad_stufaps_course', label: 'GAD StuFAPs' },
            ],
        },
        {
            title: 'SHS Background',
            columns: [
                { key: 'shs_name', label: 'School Name', className: 'min-w-[190px]' },
                { key: 'shs_address', label: 'School Address', className: 'min-w-[210px]' },
            ],
        },
        {
            title: 'Family Income',
            columns: [
                { key: 'father_name', label: 'Father' },
                { key: 'father_occupation', label: 'Father Occupation' },
                {
                    key: 'father_income_monthly',
                    label: 'Father Income (Monthly)',
                    render: (row: ApplicationRow) => formatCurrency(row.father_income_monthly),
                },
                { key: 'father_income_yearly_bracket', label: 'Father Income (Yearly)' },
                { key: 'mother_name', label: 'Mother' },
                { key: 'mother_occupation', label: 'Mother Occupation' },
                {
                    key: 'mother_income_monthly',
                    label: 'Mother Income (Monthly)',
                    render: (row: ApplicationRow) => formatCurrency(row.mother_income_monthly),
                },
                { key: 'mother_income_yearly_bracket', label: 'Mother Income (Yearly)' },
                { key: 'guardian_name', label: 'Guardian' },
                { key: 'guardian_occupation', label: 'Guardian Occupation' },
                {
                    key: 'guardian_income_monthly',
                    label: 'Guardian Income (Monthly)',
                    render: (row: ApplicationRow) => formatCurrency(row.guardian_income_monthly),
                },
            ],
        },
        {
            title: 'Grades & Groups',
            columns: [
                { key: 'gwa_g12_s1', label: 'GWA G12 S1', render: (row: ApplicationRow) => formatGrade(row.gwa_g12_s1) },
                { key: 'gwa_g12_s2', label: 'GWA G12 S2', render: (row: ApplicationRow) => formatGrade(row.gwa_g12_s2) },
                {
                    key: 'special_groups',
                    label: 'Special Groups',
                    className: 'min-w-[180px]',
                    render: (row: ApplicationRow) => (
                        <div className="flex flex-wrap gap-1">
                            {row.special_groups?.length
                                ? row.special_groups.map((group) => (
                                    <Badge key={group} variant="outline" className="bg-zinc-50 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                                        {group}
                                    </Badge>
                                ))
                                : '—'}
                        </div>
                    ),
                },
            ],
        },
        {
            title: 'Submission Details',
            columns: [
                { key: 'academic_year', label: 'Academic Year' },
                { key: 'deadline', label: 'Deadline', render: (row: ApplicationRow) => formatDateOnly(row.deadline) },
                {
                    key: 'created_at',
                    label: 'Submitted',
                    className: 'min-w-[190px]',
                    render: (row: ApplicationRow) => fmtDate(row.created_at),
                },
            ],
        },
    ];

    const flatColumns = columnGroups.flatMap((group) => group.columns);

    return (
        <div className="mt-5 px-4 py-4">
            <div className="mb-4 rounded-lg bg-zinc-100 px-4 py-3 text-sm text-zinc-700 dark:bg-zinc-900/70 dark:text-zinc-300">
                Review, filter, and export consolidated CMSP application data. Grouped column headers help you scan related information quickly.
                Use the search bar to find applicants by name, course, or school.
            </div>
            <div className="mb-3 flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between">
                {/* Left: search */}
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <div className="relative w-full sm:w-auto">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search by name, course, or school…"
                            className="h-10 w-full rounded-md border border-zinc-300 bg-white pl-9 pr-10 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') fetchData(1, search, perPage);
                            }}
                        />
                        {search && (
                            <button
                                type="button"
                                aria-label="Clear search"
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:hover:bg-zinc-800"
                                onClick={() => { setSearch(''); fetchData(1, '', perPage); }}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            size="sm"
                            className="bg-[#1e3c73] text-white shadow-sm hover:bg-[#162d55]"
                            onClick={() => fetchData(1, search, perPage)}
                        >
                            <Search className="mr-1.5 h-4 w-4" />
                            Search
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-2"
                            onClick={() => fetchData(1, search, perPage)}
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            Export current view
                        </Button>
                    </div>
                </div>
                {/* Right: per-page */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Rows per page</span>
                    <select
                        className="h-10 rounded-md border border-zinc-300 bg-white px-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900"
                        value={perPage}
                        onChange={(e) => setPerPage(Number(e.target.value))}
                    >
                        {[10, 20, 50].map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                <div className="max-w-full overflow-x-auto">
                    <Table className="min-w-[1800px] text-left">
                        <TableHeader>
                            <TableRow className="bg-zinc-100 text-xs uppercase tracking-wide text-zinc-600 dark:bg-zinc-900/80 dark:text-zinc-300 [&>th]:py-2">
                                {columnGroups.map((group) => (
                                    <TableHead key={group.title} className="text-xs font-semibold" colSpan={group.columns.length}>
                                        {group.title}
                                    </TableHead>
                                ))}
                            </TableRow>
                            <TableRow className="bg-white text-xs text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
                                {flatColumns.map((column, columnIndex) => (
                                    <TableHead
                                        key={`${column.key}-${columnIndex}`}
                                        className={cn('font-semibold text-xs uppercase tracking-wide text-zinc-600 dark:text-zinc-200', column.className)}
                                    >
                                        {column.label}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                                        {flatColumns.map((column, columnIndex) => (
                                            <TableCell
                                                key={`${column.key}-${columnIndex}`}
                                                className={cn('py-3', column.className)}
                                            >
                                                <div className="h-4 w-full max-w-[200px] animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : rows.length === 0 ? (
                                <TableRow className="border-t border-zinc-100 dark:border-zinc-800">
                                    <TableCell className="py-8 text-center text-zinc-600 dark:text-zinc-300" colSpan={flatColumns.length}>
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                                                <UserX className="h-8 w-8 text-zinc-400" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-zinc-600 dark:text-zinc-200">No applications found.</p>
                                                <p className="text-xs text-zinc-500 dark:text-zinc-400">Try adjusting your search criteria.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                rows.map((row) => (
                                    <TableRow
                                        key={row.id}
                                        className="border-t border-zinc-100 odd:bg-white even:bg-zinc-50/70 dark:border-zinc-800 dark:odd:bg-zinc-950 dark:even:bg-zinc-900"
                                    >
                                        {flatColumns.map((column, columnIndex) => (
                                            <TableCell
                                                key={`${column.key}-${columnIndex}`}
                                                className={column.className ? cn(column.className) : undefined}
                                            >
                                                {renderColumnValue(row, column)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
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
                        onClick={() => fetchData(page - 1, search, perPage)}
                    >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Prev
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={loading || page >= lastPage}
                        onClick={() => fetchData(page + 1, search, perPage)}
                    >
                        Next
                        <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, X, UserX, Accessibility, Baby, Globe, Tent, FileSpreadsheet, ChevronDown, ChevronUp, Loader2, FileCheck, SquarePen, GraduationCap } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

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

export default function Dashboard() {
    const [specialCounts, setSpecialCounts] = useState<SpecialGroupCounts>({ ...EMPTY_SPECIAL_COUNTS });

    const handleSpecialCounts = useCallback((counts: SpecialGroupCounts) => {
        setSpecialCounts({ ...counts });
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Home" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-hidden">
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

                <div className="-mx-4 sm:-mx-6 lg:-mx-8">
                    <div className="mx-auto max-w-[1280px] px-4">
                        <div className="rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                            <CmspsTable onSpecialCounts={handleSpecialCounts} />
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
        <div className="flex items-start gap-1">
            <span className="whitespace-pre-wrap break-words leading-snug">{shown}</span>
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

function CmspsTable({ onSpecialCounts }: { onSpecialCounts?: (counts: SpecialGroupCounts) => void }) {
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
    };

    const COLS = 48; // keep this in sync with the header

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

    const [rows, setRows] = useState<ApplicationRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [perPage, setPerPage] = useState(10);
    const [search, setSearch] = useState('');

    const [selectedId, setSelectedId] = useState<number | null>(null);

    const buildUrl = useCallback((p: number, s: string, pp: number) => {
        const base = (window as any).route
            ? (window as any).route('cmsp-applications.index.json')
            : '/cmsp-applications/json';

        const u = new URL(base, window.location.origin);
        u.searchParams.set('page', String(p));
        u.searchParams.set('per_page', String(pp));
        u.searchParams.set('full', '1');            // ask for all columns
        if (s.trim()) u.searchParams.set('search', s.trim());
        return u.toString();
    }, []);

    const buildExportUrl = useCallback((s: string) => {
        const base = (window as any).route
            ? (window as any).route('cmsp-applications.export')
            : '/cmsp-applications/export';

        const u = new URL(base, window.location.origin);
        if (s.trim()) u.searchParams.set('search', s.trim());
        return u.toString();
    }, []);

    const fetchData = useCallback(async (p = page, s = search, pp = perPage) => {
        setLoading(true);
        try {
            const res = await fetch(buildUrl(p, s, pp), {
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                credentials: 'same-origin',
            });
            if (!res.ok) throw new Error('Failed to load');
            const json = await res.json();
            setRows(json.data ?? []);
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
    }, [buildUrl, onSpecialCounts, page, perPage, search]);

    useEffect(() => { fetchData(1, search, perPage); }, [perPage]); // refetch when perPage changes

    const fmtDate = (iso: string) =>
        new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });

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
            window.alert('Failed to export rank list. Please try again.');
        } finally {
            setExporting(false);
        }
    }, [buildExportUrl, search]);

    return (
        <div className="mt-5 px-4 py-4">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Left: search */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search by name or course…"
                            className="h-9 w-72 rounded-md border border-zinc-300 bg-white pl-8 pr-10 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900"
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
                                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:hover:bg-zinc-800"
                                onClick={() => { setSearch(''); fetchData(1, '', perPage); }}
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
                        onClick={() => fetchData(1, search, perPage)}
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

            <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                <div className="overflow-x-auto">
                    <table className="min-w-[2000px] text-left text-sm">
                        <thead className="bg-zinc-50 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 [&>tr>th]:whitespace-nowrap">
                            <tr className="[&>th]:whitespace-nowrap">
                                <th className="px-3 py-2 font-semibold">No</th>
                                <th className="px-3 py-2 font-semibold min-w-[160px]">Tracking No</th>
                                <th className="px-3 py-2 font-semibold">LRN</th>
                                <th className="px-3 py-2 font-semibold">Email</th>
                                <th className="px-3 py-2 font-semibold">Contact #</th>
                                <th className="px-3 py-2 font-semibold min-w-[160px]">Name</th>
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
                                <th className="px-3 py-2 font-semibold min-w-[190px]">Submitted</th>
                                <th className="px-3 py-2 font-semibold">Action</th>
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
                            ) : rows.length === 0 ? (
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
                                rows.map((r, idx) => (
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
                                        className={`border-t border-zinc-100 dark:border-zinc-800 cursor-pointer transition-all
                                                hover:bg-zinc-50 dark:hover:bg-zinc-900/40
                                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500
                                                ${selectedId === r.id
                                                ? 'bg-blue-100/80 dark:bg-blue-900/50 ring-2 ring-inset ring-blue-400/60 dark:ring-blue-700/60'
                                                : ''}`}
                                    >
                                        <td className={`px-3 py-2 ${selectedId === r.id ? 'border-l-4 border-blue-500 pl-2 dark:border-blue-600' : ''}`}>
                                            {idx + 1 + (page - 1) * perPage}
                                        </td>

                                        <td className="px-3 py-2">
                                            <span className="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                                                {r.tracking_no}
                                            </span>
                                        </td>

                                        <td className="px-3 py-2">{r.lrn}</td>

                                        <td className="px-3 py-2" title={r.email}>
                                            <TruncateCell value={r.email} max={30} />
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
                                        <td className="px-3 py-2">{fmtDate(r.created_at)}</td>
                                        <td className="px-3 py-2">
                                            <Button
                                                variant="ghost"
                                                className="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 px-3 py-1 rounded-md transition"
                                                title="Validate Application"
                                                // sample code for password reset action
                                                //onClick={() => {
                                                //     router.post(route('users.resetPassword', user.id), {}, {
                                                //         preserveScroll: true,
                                                //         preserveState: true,
                                                //         onSuccess: () => {
                                                //             toast.success(`Password reset for ${user.name}!`, {
                                                //                 description: "Default password: 12345678",
                                                //             });
                                                //         },
                                                //         onError: () => {
                                                //             toast.error("Failed to reset password.");
                                                //         },
                                                //     });
                                                // }}
                                            >
                                               <SquarePen  className="w-4 h-4" />
                                            </Button>
                                         
                                       
                                        </td>
                                        
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

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
        </div>
    );
}

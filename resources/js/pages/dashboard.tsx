import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, House } from 'lucide-react';


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
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div>
                </div>
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <CmspsTable />
                </div>
            </div>
        </AppLayout>
    );
}


function CmspsTable() {
    type ApplicationRow = {
        id: number;
        incoming: boolean;
        // identity / contact
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

        // address (home)
        province_municipality: string;
        barangay: string;
        purok_street: string;
        zip_code: string | null;
        district: string;

        // address (BARMM optional)
        barmm_province: string | null;
        barmm_municipality: string | null;
        barmm_barangay: string | null;
        barmm_purok_street: string | null;
        barmm_zip_code: string | null;

        // acad intent
        intended_school: string;
        school_type: 'Public' | 'LUC' | 'Private';
        other_school: string | null;
        year_level: string;
        course: string;
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
        gwa_g11_s1: number;
        gwa_g11_s2: number;
        gwa_g12_s1: number;

        // misc
        special_groups: string[]; // make sure model casts to array
        consent: boolean;
        academic_year: string;
        deadline: string; // ISO date
        created_at: string; // ISO datetime
    };


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

    return (
        <div className="mt-10">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Left: search */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search by name or course…"
                            className="h-9 w-72 rounded-md border border-zinc-300 bg-white pl-8 pr-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-zinc-700 dark:bg-zinc-900"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') fetchData(1, search, perPage);
                            }}
                        />
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => fetchData(1, search, perPage)}>
                        Search
                    </Button>
                    {search && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => { setSearch(''); fetchData(1, '', perPage); }}
                        >
                            Clear
                        </Button>
                    )}
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
                </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
                <div className="max-w-full overflow-x-auto">
                    <table className="min-w-[720px] w-full text-left text-sm">
                        <thead className="bg-zinc-50 text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
                            <tr className="[&>th]:whitespace-nowrap">
                                <th className="px-3 py-2 font-semibold">LRN</th>
                                <th className="px-3 py-2 font-semibold">Email</th>
                                <th className="px-3 py-2 font-semibold">Contact #</th>
                                <th className="px-3 py-2 font-semibold">Name</th>
                                <th className="px-3 py-2 font-semibold">Name Ext.</th>
                                <th className="px-3 py-2 font-semibold">Maiden Name</th>
                                <th className="px-3 py-2 font-semibold">Sex</th>
                                <th className="px-3 py-2 font-semibold">Birthdate</th>

                                <th className="px-3 py-2 font-semibold">Province/Municipality</th>
                                <th className="px-3 py-2 font-semibold">District</th>
                                <th className="px-3 py-2 font-semibold">Barangay</th>
                                <th className="px-3 py-2 font-semibold">Purok/Street</th>
                                <th className="px-3 py-2 font-semibold">ZIP</th>

                                <th className="px-3 py-2 font-semibold">BARMM Province</th>
                                <th className="px-3 py-2 font-semibold">BARMM Municipality</th>
                                <th className="px-3 py-2 font-semibold">BARMM Barangay</th>
                                <th className="px-3 py-2 font-semibold">BARMM Street</th>
                                <th className="px-3 py-2 font-semibold">BARMM ZIP</th>

                                <th className="px-3 py-2 font-semibold">Intended School</th>
                                <th className="px-3 py-2 font-semibold">School Type</th>
                                <th className="px-3 py-2 font-semibold">Other School</th>
                                <th className="px-3 py-2 font-semibold">Year Level</th>
                                <th className="px-3 py-2 font-semibold">Course</th>
                                <th className="px-3 py-2 font-semibold">GAD StuFAPs</th>

                                <th className="px-3 py-2 font-semibold">SHS School Name</th>
                                <th className="px-3 py-2 font-semibold">SHS School Address</th>

                                <th className="px-3 py-2 font-semibold">Father</th>
                                <th className="px-3 py-2 font-semibold">Father Occupation</th>
                                <th className="px-3 py-2 font-semibold">Father Income (monthly)</th>
                                <th className="px-3 py-2 font-semibold">Father Income (yearly)</th>

                                <th className="px-3 py-2 font-semibold">Mother</th>
                                <th className="px-3 py-2 font-semibold">Mother Occupation</th>
                                <th className="px-3 py-2 font-semibold">Mother Income (monthly)</th>
                                <th className="px-3 py-2 font-semibold">Mother Income (yearly)</th>

                                <th className="px-3 py-2 font-semibold">Guardian</th>
                                <th className="px-3 py-2 font-semibold">Guardian Occupation</th>
                                <th className="px-3 py-2 font-semibold">Guardian Income (monthly)</th>

                                <th className="px-3 py-2 font-semibold">GWA G11 S1</th>
                                <th className="px-3 py-2 font-semibold">GWA G11 S2</th>
                                <th className="px-3 py-2 font-semibold">GWA G12 S1</th>

                                <th className="px-3 py-2 font-semibold">Special Groups</th>
                           
                                <th className="px-3 py-2 font-semibold">AY</th>
                                <th className="px-3 py-2 font-semibold">Deadline</th>
                                <th className="px-3 py-2 font-semibold text-right">Submitted</th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-t border-zinc-100 dark:border-zinc-800">
                                        {Array.from({ length: 45 }).map((__, j) => (
                                            <td key={j} className="px-3 py-2">
                                                <div className="h-4 w-full max-w-[220px] animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : rows.length === 0 ? (
                                <tr className="border-t border-zinc-100 dark:border-zinc-800">
                                    <td className="px-3 py-6 text-center text-zinc-600 dark:text-zinc-300" colSpan={45}>
                                        No applications found.
                                    </td>
                                </tr>
                            ) : (
                                rows.map((r) => (
                                    <tr key={r.id} className="border-t border-zinc-100 dark:border-zinc-800">
                                        <td className="px-3 py-2">{r.lrn}</td>
                                        <td className="px-3 py-2">{r.email}</td>
                                        <td className="px-3 py-2">{r.contact_number}</td>
                                        <td className="px-3 py-2">
                                            {r.last_name}, {r.first_name} {r.middle_name ?? ''} {r.name_extension ?? ''}
                                         
                                        </td>
                                        <td className="px-3 py-2">{r.name_extension ?? '—'}</td>
                                        <td className="px-3 py-2">{r.maiden_name ?? '—'}</td>
                                        <td className="px-3 py-2 capitalize">{r.sex}</td>
                                        <td className="px-3 py-2">{new Date(r.birthdate).toLocaleDateString()}</td>

                                        <td className="px-3 py-2">{r.province_municipality}</td>
                                        <td className="px-3 py-2">{r.district}</td>
                                        <td className="px-3 py-2">{r.barangay}</td>
                                        <td className="px-3 py-2">{r.purok_street}</td>
                                        <td className="px-3 py-2">{r.zip_code ?? '—'}</td>

                                        <td className="px-3 py-2">{r.barmm_province ?? '—'}</td>
                                        <td className="px-3 py-2">{r.barmm_municipality ?? '—'}</td>
                                        <td className="px-3 py-2">{r.barmm_barangay ?? '—'}</td>
                                        <td className="px-3 py-2">{r.barmm_purok_street ?? '—'}</td>
                                        <td className="px-3 py-2">{r.barmm_zip_code ?? '—'}</td>

                                        <td className="px-3 py-2">{r.intended_school}</td>
                                        <td className="px-3 py-2">{r.school_type}</td>
                                        <td className="px-3 py-2">{r.other_school ?? '—'}</td>
                                        <td className="px-3 py-2">{r.year_level}</td>
                                        <td className="px-3 py-2" title={r.course}>{r.course}</td>
                                        <td className="px-3 py-2">{r.gad_stufaps_course ?? '—'}</td>

                                        <td className="px-3 py-2">{r.shs_name}</td>
                                         <td className="px-3 py-2">{r.shs_address}</td>

                                        <td className="px-3 py-2">{r.father_name}</td>
                                        <td className="px-3 py-2">{r.father_occupation}</td>
                                        <td className="px-3 py-2">{r.father_income_monthly}</td>
                                        <td className="px-3 py-2">{r.father_income_yearly_bracket}</td>

                                        <td className="px-3 py-2">{r.mother_name}</td>
                                        <td className="px-3 py-2">{r.mother_occupation}</td>
                                        <td className="px-3 py-2">{r.mother_income_monthly}</td>
                                        <td className="px-3 py-2">{r.mother_income_yearly_bracket}</td>

                                        <td className="px-3 py-2">{r.guardian_name}</td>
                                        <td className="px-3 py-2">{r.guardian_occupation}</td>
                                        <td className="px-3 py-2">{r.guardian_income_monthly}</td>

                                        <td className="px-3 py-2">{r.gwa_g11_s1}</td>
                                        <td className="px-3 py-2">{r.gwa_g11_s2}</td>
                                        <td className="px-3 py-2">{r.gwa_g12_s1}</td>

                                        <td className="px-3 py-2">{r.special_groups?.length ? r.special_groups.join(', ') : '—'}</td>
                                 
                                        <td className="px-3 py-2">{r.academic_year}</td>
                                        <td className="px-3 py-2">{new Date(r.deadline).toLocaleDateString()}</td>
                                        <td className="px-3 py-2 text-right">{fmtDate(r.created_at)}</td>
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

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import {
    isDiscontinuedProgram,
    isPriorityCourse,
    normalizeHeiProgram,
    normalizePriorityCourse,
    type CourseOption,
    type HeiProgramItem,
} from '@/lib/program-evaluation';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Building2, GraduationCap, Loader2, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'HEIs & Programs', href: '/hei_programs' }];

type HeiItem = {
    id: string;
    instCode: string;
    instName: string;
    province?: string | null;
    municipalityCity?: string | null;
};

const normalizeHeiItem = (item: unknown, index: number): HeiItem | null => {
    if (!item || typeof item !== 'object') {
        return null;
    }

    const raw = item as Record<string, unknown>;
    const instName = String(raw.instName ?? '').trim();
    const instCode = String(raw.instCode ?? '').trim();
    const province = String(raw.province ?? '').trim();
    const municipalityCity = String(raw.municipalityCity ?? '').trim();

    if (!instName || !instCode) {
        return null;
    }

    return {
        id: [instCode, instName, province, municipalityCity, String(index)].join('::'),
        instCode,
        instName,
        province: province || null,
        municipalityCity: municipalityCity || null,
    };
};

const isPlaceholderCode = (value: string) => {
    const normalized = value.trim().toLowerCase();
    return normalized === 'pending' || normalized === 'n/a' || normalized === 'na' || normalized === 'null';
};

export default function HeiProgramsPage() {
    const [heis, setHeis] = useState<HeiItem[]>([]);
    const [search, setSearch] = useState('');
    const [programSearch, setProgramSearch] = useState('');
    const [selectedHei, setSelectedHei] = useState<HeiItem | null>(null);
    const [programs, setPrograms] = useState<HeiProgramItem[]>([]);
    const [priorityCourses, setPriorityCourses] = useState<CourseOption[]>([]);
    const [loadingHei, setLoadingHei] = useState(true);
    const [loadingPrograms, setLoadingPrograms] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const loadHei = async () => {
            setLoadingHei(true);
            try {
                const res = await fetch('/api/hei_programs', {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                });

                if (!res.ok) throw new Error('Failed to fetch HEIs');
                const json = await res.json();

                if (cancelled) return;
                const items = Array.isArray(json?.items)
                    ? json.items.map(normalizeHeiItem).filter((item: HeiItem | null): item is HeiItem => item !== null)
                    : [];
                setHeis(items);
                if (items.length > 0) {
                    setSelectedHei(items[0]);
                }
            } catch {
                if (!cancelled) {
                    setHeis([]);
                }
            } finally {
                if (!cancelled) setLoadingHei(false);
            }
        };

        void loadHei();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        const loadPriorityCourses = async () => {
            try {
                const res = await fetch('/api/courses', {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                });

                if (!res.ok) throw new Error('Failed to fetch courses');
                const json = await res.json();
                if (cancelled) return;

                const items = Array.isArray(json?.data) ? json.data : [];
                setPriorityCourses(items.map(normalizePriorityCourse).filter((item: CourseOption | null): item is CourseOption => item !== null));
            } catch {
                if (!cancelled) {
                    setPriorityCourses([]);
                }
            }
        };

        void loadPriorityCourses();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        const loadPrograms = async () => {
            if (!selectedHei?.instCode) {
                setPrograms([]);
                return;
            }

            setLoadingPrograms(true);
            try {
                const res = await fetch(`/api/hei_programs/${selectedHei.instCode}/programs`, {
                    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                    credentials: 'same-origin',
                });

                if (!res.ok) throw new Error('Failed to fetch programs');
                const json = await res.json();

                if (!cancelled) {
                    const items = Array.isArray(json?.programs) ? json.programs : [];
                    setPrograms(items.map(normalizeHeiProgram).filter((item: HeiProgramItem | null): item is HeiProgramItem => item !== null));
                }
            } catch {
                if (!cancelled) {
                    setPrograms([]);
                }
            } finally {
                if (!cancelled) setLoadingPrograms(false);
            }
        };

        void loadPrograms();

        return () => {
            cancelled = true;
        };
    }, [selectedHei]);

    useEffect(() => {
        setProgramSearch('');
    }, [selectedHei?.instCode]);

    const filteredHeis = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return heis;

        return heis.filter((hei) =>
            `${hei.instCode} ${hei.instName} ${hei.province ?? ''} ${hei.municipalityCity ?? ''}`.toLowerCase().includes(keyword),
        );
    }, [heis, search]);

    const filteredPrograms = useMemo(() => {
        const keyword = programSearch.trim().toLowerCase();
        if (!keyword) return programs;

        return programs.filter((program) =>
            `${program.programName} ${program.major ?? ''} ${program.programStatus ?? ''} ${program.statusLabel ?? ''}`
                .toLowerCase()
                .includes(keyword),
        );
    }, [programSearch, programs]);

    const programRows = useMemo(
        () =>
            filteredPrograms.map((program) => ({
                program,
                matched: isPriorityCourse(program.programName, priorityCourses),
            })),
        [filteredPrograms, priorityCourses],
    );

    const matchedCount = useMemo(() => programRows.filter((row) => row.matched).length, [programRows]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="HEIs & Programs" />

            <div className="p-4 md:p-6">
                <div className="mb-5 rounded-xl border border-blue-200/60 bg-gradient-to-r from-blue-50 via-indigo-50 to-sky-50 p-5 shadow-sm dark:border-blue-900/40 dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-slate-950/30">
                    <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">HEIs & Programs</h1>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        Browse Higher Education Institutions and view the list of programs offered per institution.
                    </p>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Green items indicate a match with CHED Priority Courses.</p>
                </div>

                <div className="grid gap-5 lg:grid-cols-2">
                    <Card className="border-blue-100/80 shadow-sm dark:border-blue-900/40">
                        <CardHeader className="rounded-t-xl bg-blue-50/70 dark:bg-blue-950/20">
                            <CardTitle className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                                <Building2 className="h-5 w-5" /> HEIs
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="space-y-3 p-4">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    className="pl-9"
                                    placeholder="Search by code, name, province, city"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                />
                            </div>

                            <div className="max-h-[520px] space-y-2 overflow-y-auto rounded-lg border border-blue-100 bg-slate-50/60 p-2 dark:border-slate-800 dark:bg-slate-900/40">
                                {loadingHei ? (
                                    <div className="flex items-center gap-2 p-2 text-sm text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin" /> Loading HEIs...
                                    </div>
                                ) : filteredHeis.length === 0 ? (
                                    <p className="p-2 text-sm text-muted-foreground">No HEI found.</p>
                                ) : (
                                    filteredHeis.map((hei, heiIndex) => (
                                        <Button
                                            key={hei.id}
                                            variant="ghost"
                                            className={`h-auto w-full justify-start border px-3 py-2 text-left whitespace-normal ${selectedHei?.id === hei.id ? 'border-blue-300 bg-blue-100 text-blue-900 hover:bg-blue-200 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-100' : 'border-transparent hover:border-blue-200 hover:bg-blue-50 dark:hover:border-blue-900/50 dark:hover:bg-blue-950/20'}`}
                                            onClick={() => setSelectedHei(hei)}
                                        >
                                            <div className="space-y-1">
                                                <div className="leading-snug font-semibold">
                                                    {heiIndex + 1}. {hei.instName}
                                                </div>
                                                <div className="text-xs opacity-80">
                                                    Code: {isPlaceholderCode(hei.instCode) ? 'Unavailable' : hei.instCode}
                                                </div>
                                                {(hei.province || hei.municipalityCity) && (
                                                    <div className="text-xs opacity-80">
                                                        {hei.municipalityCity ?? ''}
                                                        {hei.municipalityCity && hei.province ? ', ' : ''}
                                                        {hei.province ?? ''}
                                                    </div>
                                                )}
                                            </div>
                                        </Button>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-200/70 bg-white/70 shadow-sm backdrop-blur dark:border-slate-800/70 dark:bg-slate-950/40">
                        <CardHeader className="border-b border-slate-200/60 bg-slate-50/60 px-4 py-3 dark:border-slate-800/60 dark:bg-slate-900/30">
                            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                                    <GraduationCap className="h-4 w-4" />
                                </span>

                                <span>Programs</span>

                                {selectedHei ? (
                                    <span className="min-w-0 truncate text-xs font-medium text-slate-600 dark:text-slate-300">
                                        • {selectedHei.instName}
                                    </span>
                                ) : null}
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="p-4">
                            {!selectedHei ? (
                                <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                                    Select an HEI to view programs.
                                </div>
                            ) : loadingPrograms ? (
                                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-300">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading programs…
                                </div>
                            ) : programs.length === 0 ? (
                                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-300">
                                    No programs found for this HEI.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <div className="relative">
                                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            className="pl-9"
                                            placeholder="Search by program, major, status"
                                            value={programSearch}
                                            onChange={(event) => setProgramSearch(event.target.value)}
                                        />
                                    </div>

                                    {/* Summary strip */}
                                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-200">
                                        <span className="font-medium">HEI Code:</span>
                                        <span className="font-mono">{selectedHei.instCode}</span>

                                        <span className="mx-1 text-slate-300 dark:text-slate-700">•</span>

                                        <span className="font-medium">Matched Priority:</span>
                                        <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                            {matchedCount} / {programRows.length}
                                        </span>

                                        {programSearch.trim() ? (
                                            <>
                                                <span className="mx-1 text-slate-300 dark:text-slate-700">•</span>
                                                <span className="font-medium">Showing:</span>
                                                <span>{programRows.length} programs</span>
                                            </>
                                        ) : null}
                                    </div>

                                    {/* Programs list */}
                                    {programRows.length === 0 ? (
                                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-300">
                                            No programs match your search.
                                        </div>
                                    ) : (
                                        <ol className="max-h-[480px] divide-y divide-slate-200 overflow-y-auto scroll-smooth rounded-lg border border-slate-200 bg-white/60 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-950/20">
                                            {programRows.map((row, programIndex) => {
                                                const inactive = isDiscontinuedProgram(row.program);
                                                const matched = row.matched;
                                                const showMatched = matched;

                                                return (
                                                    <li
                                                        key={`${row.program.programName}-${row.program.major ?? ''}-${programIndex}`}
                                                        className={[
                                                            'group relative flex items-start gap-3 px-4 py-3 transition-colors',
                                                            'hover:bg-slate-50/70 dark:hover:bg-slate-900/30',
                                                            showMatched ? 'bg-emerald-50/60 dark:bg-emerald-950/20' : '',
                                                            inactive ? 'bg-red-50/40 opacity-80 dark:bg-red-950/10' : '',
                                                        ].join(' ')}
                                                    >
                                                        {showMatched ? (
                                                            <span className="absolute top-0 left-0 h-full w-1 rounded-l-lg bg-emerald-500/40 dark:bg-emerald-400/30" />
                                                        ) : null}

                                                        <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                                                            {programIndex + 1}
                                                        </span>

                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                                {row.program.programName}
                                                            </p>

                                                            {row.program.major ? (
                                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                                                                    Major: {row.program.major}
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                        <div className="flex shrink-0 items-center gap-1.5">
                                                            {inactive && (
                                                                <Badge className="border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                                                                    Discontinued
                                                                </Badge>
                                                            )}

                                                            {matched && (
                                                                <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
                                                                    Priority Course
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ol>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

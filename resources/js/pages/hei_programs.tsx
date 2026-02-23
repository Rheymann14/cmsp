import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Building2, GraduationCap, Loader2, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'HEIs & Programs', href: '/hei_programs' }];

type HeiItem = {
    instCode: string;
    instName: string;
    province?: string | null;
    municipalityCity?: string | null;
};

type CourseOption = {
    id: number;
    label: string;
};

type ProgramItem = {
    programName: string;
    major?: string | null;
    status?: number | null;
};

const normalizeText = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const compactText = (value: string): string => normalizeText(value).replace(/\s+/g, '');

const stopWords = new Set([
    'bachelor',
    'science',
    'arts',
    'in',
    'of',
    'and',
    'the',
    'major',
    'related',
    'fields',
    'education',
]);

const extractAcronym = (value: string): string =>
    normalizeText(value)
        .split(' ')
        .filter((word) => word && !stopWords.has(word))
        .map((word) => word[0])
        .join('')
        .toUpperCase();

const isPriorityMatch = (programName: string, courses: CourseOption[]): boolean => {
    const normalizedProgram = normalizeText(programName);
    const compactProgram = compactText(programName);
    const acronymProgram = extractAcronym(programName);

    return courses.some((course) => {
        const normalizedCourse = normalizeText(course.label);
        const compactCourse = compactText(course.label);
        const acronymCourse = extractAcronym(course.label);

        return (
            normalizedProgram === normalizedCourse ||
            compactProgram === compactCourse ||
            normalizedProgram.includes(normalizedCourse) ||
            normalizedCourse.includes(normalizedProgram) ||
            (acronymProgram.length >= 3 && acronymProgram === acronymCourse) ||
            (acronymCourse.length >= 3 && compactProgram.includes(acronymCourse.toLowerCase()))
        );
    });
};

export default function HeiProgramsPage() {
    const [heis, setHeis] = useState<HeiItem[]>([]);
    const [search, setSearch] = useState('');
    const [selectedHei, setSelectedHei] = useState<HeiItem | null>(null);
    const [programs, setPrograms] = useState<ProgramItem[]>([]);
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
                const items = Array.isArray(json?.items) ? json.items : [];
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
                setPriorityCourses(
                    items
                        .map((item: Record<string, unknown>) => ({
                            id: Number(item.id),
                            label: String(item.label ?? ''),
                        }))
                        .filter((item: CourseOption) => Number.isFinite(item.id) && item.label.length > 0),
                );
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
                    const normalizedPrograms: Array<ProgramItem | null> = items.map((item: unknown) => {
                        if (typeof item === 'string') {
                            return {
                                programName: item,
                                major: null,
                                status: null,
                            };
                        }

                        if (!item || typeof item !== 'object') return null;
                        const typedItem = item as Record<string, unknown>;

                        return {
                            programName: String(typedItem.programName ?? '').trim(),
                            major: typedItem.major ? String(typedItem.major).trim() : null,
                            status:
                                typedItem.status === 0 || typedItem.status === '0'
                                    ? 0
                                    : typedItem.status === 1 || typedItem.status === '1'
                                        ? 1
                                        : typedItem.status == null
                                            ? null
                                            : Number(typedItem.status),
                        };
                    });

                    setPrograms(normalizedPrograms.filter((item: ProgramItem | null): item is ProgramItem => Boolean(item?.programName)));
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

    const filteredHeis = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return heis;

        return heis.filter((hei) =>
            `${hei.instCode} ${hei.instName} ${hei.province ?? ''} ${hei.municipalityCity ?? ''}`.toLowerCase().includes(keyword),
        );
    }, [heis, search]);

    const programRows = useMemo(
        () =>
            programs.map((program) => ({
                program,
                matched: isPriorityMatch(program.programName, priorityCourses),
            })),
        [programs, priorityCourses],
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
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                        Green items indicate a match with CHED Priority Courses.
                    </p>
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
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
                                            key={hei.instCode}
                                            variant="ghost"
                                            className={`h-auto w-full justify-start whitespace-normal border px-3 py-2 text-left ${selectedHei?.instCode === hei.instCode ? 'border-blue-300 bg-blue-100 text-blue-900 hover:bg-blue-200 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-100' : 'border-transparent hover:border-blue-200 hover:bg-blue-50 dark:hover:border-blue-900/50 dark:hover:bg-blue-950/20'}`}
                                            onClick={() => setSelectedHei(hei)}
                                        >
                                            <div className="space-y-1">
                                                <div className="font-semibold leading-snug">
                                                    {heiIndex + 1}. {hei.instName}
                                                </div>
                                                <div className="text-xs opacity-80">Code: {hei.instCode}</div>
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
                                    {/* Summary strip */}
                                    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900/30 dark:text-slate-200">
                                        <span className="font-medium">HEI Code:</span>
                                        <span className="font-mono">{selectedHei.instCode}</span>

                                        <span className="mx-1 text-slate-300 dark:text-slate-700">•</span>

                                        <span className="font-medium">Matched Priority:</span>
                                        <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                            {matchedCount} / {programRows.length}
                                        </span>
                                    </div>

                                    {/* Programs list */}
                                    <ol
                                        className="
                                            divide-y divide-slate-200
                                            rounded-lg border border-slate-200
                                            bg-white/60
                                            max-h-[420px] overflow-y-auto
                                            scroll-smooth
                                            dark:divide-slate-800
                                            dark:border-slate-800
                                            dark:bg-slate-950/20
                                        "
                                    >
                                        {programRows.map((row, programIndex) => {
                                            const inactive = row.program.status === 0;
                                            const matched = row.matched;

                                            // Inactive should "win" over matched highlight
                                            const showMatched = matched;

                                            return (
                                                <li
                                                    key={`${row.program.programName}-${row.program.major ?? ""}-${programIndex}`}
                                                    className={[
                                                        "group relative flex items-start gap-3 px-4 py-3 transition-colors",
                                                        "hover:bg-slate-50/70 dark:hover:bg-slate-900/30",
                                                        showMatched ? "bg-emerald-50/60 dark:bg-emerald-950/20" : "",
                                                        inactive ? "bg-red-50/40 dark:bg-red-950/10 opacity-80" : "",
                                                    ].join(" ")}
                                                >
                                                    {showMatched ? (
                                                        <span className="absolute left-0 top-0 h-full w-1 rounded-l-lg bg-emerald-500/40 dark:bg-emerald-400/30" />
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
                                                                Inactive
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
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}

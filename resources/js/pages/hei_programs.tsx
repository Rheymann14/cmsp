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
    status?: string | null;
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
                            status: typedItem.status ? String(typedItem.status).trim() : null,
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

                    <Card className="border-amber-100/80 shadow-sm dark:border-amber-900/40">
                        <CardHeader className="rounded-t-xl bg-amber-50/70 dark:bg-amber-950/20">
                            <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
                                <GraduationCap className="h-5 w-5" /> Programs {selectedHei ? `· ${selectedHei.instName}` : ''}
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="p-4">
                            {!selectedHei ? (
                                <p className="text-sm text-muted-foreground">Select an HEI to view programs.</p>
                            ) : loadingPrograms ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Loading programs...
                                </div>
                            ) : programs.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No programs found for this HEI.</p>
                            ) : (
                                <div className="space-y-3">
                                    <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-100">
                                        <span className="font-semibold">HEI Code:</span> {selectedHei.instCode}
                                        <span className="mx-2">•</span>
                                        <span className="font-semibold text-green-700 dark:text-green-300">Matched Priority Courses:</span> {matchedCount} / {programRows.length}
                                    </div>

                                    <ol className="space-y-2 rounded-lg border border-amber-100 bg-amber-50/30 p-3 dark:border-amber-900/40 dark:bg-amber-950/10">
                                        {programRows.map((row, programIndex) => (
                                            <li
                                                key={`${row.program.programName}-${row.program.major ?? ''}-${programIndex}`}
                                                className={`text-sm ${row.program.status?.toLowerCase() === 'inactive' ? 'text-red-700 dark:text-red-300 font-medium' : row.matched ? 'text-green-700 dark:text-green-300 font-medium' : 'text-amber-900 dark:text-amber-100'}`}
                                            >
                                                <span className="mr-2 font-semibold">{programIndex + 1}.</span>
                                                <span>{row.program.programName}</span>
                                                {row.program.major && <span className="ml-2 text-xs text-muted-foreground">(Major: {row.program.major})</span>}
                                                {row.program.status?.toLowerCase() === 'inactive' && (
                                                    <Badge className="ml-2 border-red-200 bg-red-100 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                                                        Inactive
                                                    </Badge>
                                                )}
                                            </li>
                                        ))}
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

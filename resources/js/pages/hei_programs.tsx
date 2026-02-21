import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'HEIs & Programs', href: '/hei_programs' },
];

type HeiItem = {
    instCode: string;
    instName: string;
    province?: string | null;
    municipalityCity?: string | null;
};

export default function HeiProgramsPage() {
    const [heis, setHeis] = useState<HeiItem[]>([]);
    const [search, setSearch] = useState('');
    const [selectedHei, setSelectedHei] = useState<HeiItem | null>(null);
    const [programs, setPrograms] = useState<string[]>([]);
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
                    setPrograms(Array.isArray(json?.programs) ? json.programs : []);
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
            `${hei.instCode} ${hei.instName} ${hei.province ?? ''} ${hei.municipalityCity ?? ''}`
                .toLowerCase()
                .includes(keyword)
        );
    }, [heis, search]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="HEIs & Programs" />

            <div className="grid gap-4 p-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>HEIs</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Input
                            placeholder="Search HEI by code, name, province, city"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                        />

                        <div className="max-h-[500px] space-y-2 overflow-y-auto rounded border p-2">
                            {loadingHei ? (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" /> Loading HEIs...
                                </div>
                            ) : filteredHeis.length === 0 ? (
                                <p className="text-sm text-muted-foreground">No HEI found.</p>
                            ) : (
                                filteredHeis.map((hei) => (
                                    <Button
                                        key={hei.instCode}
                                        variant={selectedHei?.instCode === hei.instCode ? 'default' : 'outline'}
                                        className="h-auto w-full justify-start whitespace-normal text-left"
                                        onClick={() => setSelectedHei(hei)}
                                    >
                                        <div>
                                            <div className="font-semibold">{hei.instName}</div>
                                            <div className="text-xs opacity-80">{hei.instCode}</div>
                                        </div>
                                    </Button>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            Programs {selectedHei ? `- ${selectedHei.instName}` : ''}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!selectedHei ? (
                            <p className="text-sm text-muted-foreground">Select an HEI to view programs.</p>
                        ) : loadingPrograms ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" /> Loading programs...
                            </div>
                        ) : programs.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No programs found for this HEI.</p>
                        ) : (
                            <ul className="list-disc space-y-1 pl-5 text-sm">
                                {programs.map((program) => (
                                    <li key={program}>{program}</li>
                                ))}
                            </ul>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

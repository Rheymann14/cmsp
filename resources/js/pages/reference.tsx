import AppLayout from '@/layouts/app-layout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { type BreadcrumbItem, type ReferencePoint, type SharedData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { FormEvent } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reference', href: '/reference' },
];

interface ReferencePageProps {
    gradePoints: ReferencePoint[];
    incomePoints: ReferencePoint[];
}

interface ReferenceFormItem {
    id: number;
    equivalent_points: string;
}

const formatGradeValue = (value: number) =>
    Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2);

const formatIncomeValue = (value: number) =>
    new Intl.NumberFormat('en-PH', { minimumFractionDigits: 0 }).format(value);

export default function ReferencePage({ gradePoints, incomePoints }: ReferencePageProps) {
    const { flash } = usePage<SharedData>();
    const { data, setData, put, processing, errors } = useForm<{ items: ReferenceFormItem[] }>({
        items: [...gradePoints, ...incomePoints].map((point) => ({
            id: point.id,
            equivalent_points: String(point.equivalent_points),
        })),
    });

    const handlePointChange = (id: number, value: string) => {
        setData('items', data.items.map((item) => (item.id === id ? { ...item, equivalent_points: value } : item)));
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        put(route('reference.update'));
    };

    const successMessage = flash?.success;
    const errorMessages = Object.values(errors).filter(Boolean);

    const valueFor = (id: number) => data.items.find((item) => item.id === id)?.equivalent_points ?? '';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reference Points" />
            <div className="flex flex-col gap-6 rounded-xl p-4 sm:p-6 lg:p-8">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight text-[#1e3c72] dark:text-zinc-100">
                        Reference Points
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Adjust the equivalent points used to compute the CMSP ranking.
                    </p>
                </div>

                {successMessage && (
                    <Alert>
                        <AlertTitle>Saved</AlertTitle>
                        <AlertDescription>{successMessage}</AlertDescription>
                    </Alert>
                )}

                {errorMessages.length > 0 && (
                    <Alert variant="destructive">
                        <AlertTitle>Unable to save</AlertTitle>
                        <AlertDescription>{errorMessages[0]}</AlertDescription>
                    </Alert>
                )}

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
                        <Button type="submit" disabled={processing}>
                            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

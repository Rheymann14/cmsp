import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage, router } from '@inertiajs/react';
import { Search, UserX, CalendarClock, UserRoundPlus, UserRoundX, Pencil, Plus, KeyRound  } from "lucide-react";
import { Toaster, toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { useForm } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"


type User = {
    id: number;
    name: string;
    email: string;
    region_id?: string | null;
    region?: { id: string; region: string; status?: string } | null;
    roles?: { id: string; role: string; status?: string }[];
    created_at: string;
    deleted_at?: string;
};

type PaginatedUsers = {
    data: User[];
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
};

type DashboardPageProps = {
    users: PaginatedUsers;
    filters: {
        search?: string;
        sortBy?: string;
        sortDir?: string;
        perPage?: number;
        quarter?: string;
    };
    years: number[];
    year: number;
    quarterData: Record<string, number>;
    provinceData: Record<string, number>;
    roles: { id: string; role: string; status?: string }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Role',
        href: '/role_management',
    },
];




export default function RoleManagement() {


    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        region_id: '',
    })

    const [open, setOpen] = useState(false);


    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(route('users.store'), {
            onSuccess: () => {
                reset();
                setOpen(false);
                toast.success('Success!', {
                    description: 'Successfully Created!',
                });
            },
            onError: (errors) => {
                toast.error('Please check the form for validation errors.', {
                    description: errors ? Object.values(errors).join('\n') : undefined,
                });
            },
        });
    }

    const {
        users,
        filters = { search: '', sortBy: 'id', sortDir: 'asc', perPage: 5 },
    } = usePage<DashboardPageProps>().props;

    const [search, setSearch] = useState(filters.search);
    const [sortBy, setSortBy] = useState(filters.sortBy);
    const [sortDir, setSortDir] = useState(filters.sortDir);
    const [perPage, setPerPage] = useState(filters.perPage);

    // Handle search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            route('role_management'),
            { search, sortBy, sortDir, perPage },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Handle sort
    const handleSort = (column: string) => {
        let dir = 'asc';
        if (sortBy === column && sortDir === 'asc') dir = 'desc';
        setSortBy(column);
        setSortDir(dir);
        router.get(
            route('role_management'),
            { search, sortBy, sortDir, perPage },
            { preserveState: true, preserveScroll: true }
        );
    };

    // Handle per page
    const handlePerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = Number(e.target.value);
        setPerPage(value);
        router.get('role_management', { search, sortBy, sortDir, perPage: value }, { preserveState: true, preserveScroll: true });
    };

    // Handle pagination
    const gotoPage = (url: string | null) => {
        if (url) {
            router.get(url, {}, { preserveState: true, preserveScroll: true });
        }
    };

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [userToEdit, setUserToEdit] = useState<User | null>(null);
    const [editData, setEditData] = useState({
        name: '', email: '', region_id: '', role_ids: [] as string[]
    });
    const [editProcessing, setEditProcessing] = useState(false);

    const [editErrors, setEditErrors] = useState<{ name?: string; email?: string; region_id?: string; role_ids?: string }>({});

    const [deletedDialogOpen, setDeletedDialogOpen] = useState(false);
    const [deletedUsers, setDeletedUsers] = useState<PaginatedUsers | null>(null);
    const [loadingDeleted, setLoadingDeleted] = useState(false);

    const [regionDialogOpen, setRegionDialogOpen] = useState(false);
    const [regionForm, setRegionForm] = useState({ region: '' });
    const [regionError, setRegionError] = useState<string | null>(null);



    type Region = { id: number | string; region: string; status?: string };
    const [regions, setRegions] = useState<Region[]>([]);
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

    const {
        data: regionData,
        setData: setRegionData,
        post: postRegion,
        processing: regionProcessing,
        errors: regionErrors,
        reset: resetRegion,
    } = useForm({
        region: ''
    });


    useEffect(() => {
        fetchRegions();
    }, []);

    useEffect(() => {
        if (!regionDialogOpen) fetchRegions();
         
    }, [regionDialogOpen]);

    function fetchRegions() {
        fetch(route('regions.index'), { headers: { Accept: 'application/json' }, credentials: 'include', })
            .then(res => res.json())
            .then(data => setRegions(data.regions || []));
    }




    type Role = { id: number | string; role: string; status?: string };
    const [roles, setRoles] = useState<Role[]>([]);
    const [roleDialogOpen, setRoleDialogOpen] = useState(false);

    const {
        data: roleData,
        setData: setRoleData,
        post: postRole,
        processing: roleProcessing,
        errors: roleErrors,
        reset: resetRole,
    } = useForm({
        role: ''
    });

    function fetchRoles() {
        fetch(route('roles.index'), { headers: { Accept: 'application/json' }, credentials: 'include' })
            .then(res => res.json())
            .then(data => setRoles(data.roles || []));
    }

    useEffect(() => {
        fetchRoles();
    }, []);

    useEffect(() => {
        if (!roleDialogOpen) fetchRoles();
         
    }, [roleDialogOpen]);

    type AyDeadline = {
        id: number;
        academic_year: string;
        deadline: string;
        deadline_formatted?: string;
        is_enabled: boolean;
    };

    const [ayDeadlines, setAyDeadlines] = useState<AyDeadline[]>([]);
    const [ayDialogOpen, setAyDialogOpen] = useState(false);
    const [selectedDeadlineId, setSelectedDeadlineId] = useState<number | 'new'>('new');

    const {
        data: ayFormData,
        setData: setAyFormData,
        post: postAyDeadline,
        put: putAyDeadline,
        processing: ayProcessing,
        errors: ayErrors,
        reset: resetAyForm,
    } = useForm({
        academic_year: '',
        deadline: '',
    });

    function fetchAyDeadlines() {
        fetch(route('ay-deadlines.index'), { headers: { Accept: 'application/json' }, credentials: 'include' })
            .then(res => res.json())
            .then(data => setAyDeadlines(data.deadlines || []));
    }

    useEffect(() => {
        fetchAyDeadlines();
    }, []);

    const setAyFormFromSelection = (id: number | 'new') => {
        if (id === 'new') {
            setSelectedDeadlineId('new');
            setAyFormData('academic_year', '');
            setAyFormData('deadline', '');
            return;
        }

        const selected = ayDeadlines.find(deadline => deadline.id === id);
        if (selected) {
            setSelectedDeadlineId(selected.id);
            setAyFormData('academic_year', selected.academic_year ?? '');
            setAyFormData('deadline', selected.deadline ?? '');
        }
    };

    const openAyDialog = (id: number | 'new') => {
        setAyFormFromSelection(id);
        setAyDialogOpen(true);
    };

    const handleAyDialogOpenChange = (open: boolean) => {
        setAyDialogOpen(open);
        if (!open) {
            resetAyForm();
            setSelectedDeadlineId('new');
        }
    };

    const handleAyDeadlineSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const payloadRoute = selectedDeadlineId === 'new'
            ? route('ay-deadlines.store')
            : route('ay-deadlines.update', selectedDeadlineId);

        const action = selectedDeadlineId === 'new'
            ? postAyDeadline
            : putAyDeadline;

        action(payloadRoute, {
            onSuccess: () => {
                toast.success(selectedDeadlineId === 'new' ? 'Academic year added!' : 'Academic year updated!');
                handleAyDialogOpenChange(false);
                fetchAyDeadlines();
            },
            onError: (formErrors) => {
                toast.error('Please check the form for validation errors.', {
                    description: formErrors ? Object.values(formErrors).join('\n') : undefined,
                });
            },
        });
    };

    const updateAyDeadlineStatus = async (deadline: AyDeadline, isEnabled: boolean) => {
        const previousDeadlines = ayDeadlines;

        if (isEnabled) {
            const otherEnabled = previousDeadlines.some(item => item.is_enabled && item.id !== deadline.id);

            if (otherEnabled) {
                toast.error('Only one academic year deadline can be enabled at a time. Disable the currently active deadline before enabling another.');
                setAyDeadlines(current =>
                    current.map(item =>
                        item.id === deadline.id ? { ...item, is_enabled: false } : item
                    )
                );
                return;
            }
        }

        setAyDeadlines(current =>
            current.map(item =>
                item.id === deadline.id ? { ...item, is_enabled: isEnabled } : item
            )
        );

        try {
            await router.patch(
                route('ay-deadlines.updateStatus', deadline.id),
                { is_enabled: isEnabled },
                {
                    onSuccess: () => {
                        toast.success('Deadline status updated!');
                    },
                    onError: () => {
                        toast.error('Failed to update deadline status.');
                        setAyDeadlines(previousDeadlines);
                    },
                }
            );
        } catch {
            toast.error('Failed to update deadline status.');
            setAyDeadlines(previousDeadlines);
        }
    };


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Role Management" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4 overflow-x-auto">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="relative   rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <Card className="relative   rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                            <CardHeader className="flex flex-row items-center justify-between p-4">
                                <div>
                                    <h2 className="text-1xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                                        <span>Region Management</span>
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage available regions in your system</p>
                                </div>
                                <Dialog open={regionDialogOpen} onOpenChange={setRegionDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            size="icon"
                                            className="bg-[#1e3c73] hover:bg-[#1a3565] text-white rounded-full shadow transition"
                                            title="Add Region"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add New Region</DialogTitle>
                                            <DialogDescription>
                                                Add a new region for the system.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form
                                            onSubmit={e => {
                                                e.preventDefault();
                                                postRegion(route('regions.store'), {
                                                    onSuccess: () => {
                                                        resetRegion();
                                                        setRegionDialogOpen(false);
                                                        toast.success('Region added!');
                                                        fetchRegions(); // Refresh the list
                                                    },
                                                    onError: () => {
                                                        toast.error('Please check the form for validation errors.');
                                                    },
                                                });
                                            }}

                                            className="space-y-4"
                                        >
                                            <div>
                                                <Label htmlFor="region">Region Name</Label>
                                                <Input
                                                    id="region"
                                                    name="region"
                                                    type="text"
                                                    required
                                                    value={regionData.region}
                                                    onChange={e => setRegionData('region', e.target.value)}
                                                />
                                                {regionErrors.region && (
                                                    <p className="text-red-500 text-sm">{regionErrors.region}</p>
                                                )}
                                            </div>
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button type="button" variant="outline">Cancel</Button>
                                                </DialogClose>
                                                <Button type="submit" disabled={regionProcessing}>
                                                    {regionProcessing ? "Creating..." : "Add Region"}
                                                </Button>
                                            </DialogFooter>
                                        </form>


                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                {regions.length > 0 ? (
                                    <div
                                        className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 pr-2"
                                        style={{ maxWidth: '100%' }}
                                    >
                                        <div className="divide-y divide-gray-200 dark:divide-gray-700 mt-4">
                                            {regions.map((region, idx) => (
                                                <div
                                                    key={region.id}
                                                    className="flex items-center gap-4 py-3 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition rounded-lg"
                                                >
                                                    {/* Number */}
                                                    <span className="text-xs text-gray-400 mr-2">{idx + 1}</span>
                                                    {/* Region name */}
                                                    <span
                                                        className="font-medium text-gray-900 dark:text-gray-100 flex-1 truncate"
                                                        title={region.region}
                                                    >
                                                        {region.region}
                                                    </span>
                                                    {/* Status dropdown */}
                                                    <select
                                                        value={region.status}
                                                        onChange={async (e) => {
                                                            const newStatus = e.target.value;
                                                            setRegions(regions =>
                                                                regions.map(r =>
                                                                    r.id === region.id ? { ...r, status: newStatus } : r
                                                                )
                                                            );
                                                            try {
                                                                await router.patch(
                                                                    route('regions.updateStatus', region.id),
                                                                    { status: newStatus },
                                                                    {
                                                                        onSuccess: () => {
                                                                            toast.success('Region status updated!');
                                                                            router.reload({ only: ['users'] }); // refresh users table
                                                                        },
                                                                        onError: () => {
                                                                            toast.error('Failed to update region status.');
                                                                            fetchRegions(); // rollback UI if failed
                                                                        },
                                                                    }
                                                                );
                                                            } catch {
                                                                toast.error('Failed to update status.');
                                                                fetchRegions();
                                                            }
                                                        }}
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold
                                                        ${region.status === 'active'
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                            }
                                                        border-none outline-none focus:ring-2  transition`}
                                                        style={{ minWidth: 100 }}
                                                    >
                                                        <option value="active">Active</option>
                                                        <option value="inactive">Inactive</option>
                                                    </select>
                                                </div>
                                            ))}

                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-500 dark:text-gray-400 py-4 text-center">
                                        No regions yet.
                                    </div>
                                )}
                            </CardContent>



                        </Card>
                    </div>
                    <div className="relative  overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <Card className="relative   rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                            <CardHeader className="flex flex-row items-center justify-between p-4">
                                <div>
                                    <h2 className="text-1xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                                        <span>Role Management</span>
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage available roles in your system</p>
                                </div>
                                <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button
                                            size="icon"
                                            className="bg-[#1e3c73] hover:bg-[#1a3565] text-white rounded-full shadow transition"
                                            title="Add Role"
                                        >
                                            <Plus className="w-5 h-5" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add New Role</DialogTitle>
                                            <DialogDescription>
                                                Add a new role for the system.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form
                                            onSubmit={e => {
                                                e.preventDefault();
                                                postRole(route('roles.store'), {
                                                    onSuccess: () => {
                                                        resetRole();
                                                        setRoleDialogOpen(false);
                                                        toast.success('Role added!');
                                                        fetchRoles(); // Refresh the list
                                                    },
                                                    onError: () => {
                                                        toast.error('Please check the form for validation errors.');
                                                    },
                                                });
                                            }}
                                            className="space-y-4"
                                        >
                                            <div>
                                                <Label htmlFor="role">Role Name</Label>
                                                <Input
                                                    id="role"
                                                    name="role"
                                                    type="text"
                                                    required
                                                    value={roleData.role}
                                                    onChange={e => setRoleData('role', e.target.value)}
                                                />
                                                {roleErrors.role && (
                                                    <p className="text-red-500 text-sm">{roleErrors.role}</p>
                                                )}
                                            </div>
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button type="button" variant="outline">Cancel</Button>
                                                </DialogClose>
                                                <Button type="submit" disabled={roleProcessing}>
                                                    {roleProcessing ? "Creating..." : "Add Role"}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                {roles.length > 0 ? (
                                    <div
                                        className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 pr-2"
                                        style={{ maxWidth: '100%' }}
                                    >
                                        <div className="divide-y divide-gray-200 dark:divide-gray-700 mt-4">
                                            {roles.map((role, idx) => (
                                                <div
                                                    key={role.id}
                                                    className="flex items-center gap-4 py-3 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition rounded-lg"
                                                >
                                                    {/* Number */}
                                                    <span className="text-xs text-gray-400 mr-2">{idx + 1}</span>
                                                    {/* Role name */}
                                                    <span
                                                        className="font-medium text-gray-900 dark:text-gray-100 flex-1 truncate"
                                                        title={role.role}
                                                    >
                                                        {role.role}
                                                    </span>
                                                    {/* Status dropdown */}
                                                    <select
                                                        value={role.status}
                                                        onChange={async (e) => {
                                                            const newStatus = e.target.value;
                                                            setRoles(roles =>
                                                                roles.map(r =>
                                                                    r.id === role.id ? { ...r, status: newStatus } : r
                                                                )
                                                            );
                                                            try {
                                                                await router.patch(
                                                                    route('roles.updateStatus', role.id),
                                                                    { status: newStatus },
                                                                    {
                                                                        onSuccess: () => {
                                                                            toast.success('Role status updated!');
                                                                            router.reload({ only: ['users'] }); // refresh users table
                                                                        },
                                                                        onError: () => {
                                                                            toast.error('Failed to update role status.');
                                                                            fetchRoles(); // rollback UI if failed
                                                                        },
                                                                    }
                                                                );

                                                            } catch {
                                                                toast.error('Failed to update status.');
                                                                fetchRoles();
                                                            }
                                                        }}
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold
                                    ${role.status === 'active'
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                            }
                                    border-none outline-none focus:ring-2 transition`}
                                                        style={{ minWidth: 100 }}
                                                    >
                                                        <option value="active">Active</option>
                                                        <option value="inactive">Inactive</option>
                                                    </select>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-500 dark:text-gray-400 py-4 text-center">
                                        No roles yet.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="relative  overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <Card className="relative   rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                            <CardHeader className="flex flex-row items-center justify-between p-4">
                                <div>
                                    <h2 className="text-1xl font-extrabold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                                        <span>CMSP Application Management</span>
                                    </h2>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage academic year deadline</p>
                                </div>
                                <Dialog open={ayDialogOpen} onOpenChange={handleAyDialogOpenChange}>
                                    <DialogTrigger asChild>
                                        <Button
                                            size="icon"
                                            className="bg-[#1e3c73] hover:bg-[#1a3565] text-white rounded-full shadow transition"
                                            title="Add or edit academic year"
                                            onClick={() => openAyDialog('new')}
                                        >
                                            <Plus className="w-5 h-5" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>{selectedDeadlineId === 'new' ? 'Add Academic Year Deadline' : 'Edit Academic Year Deadline'}</DialogTitle>
                                            <DialogDescription>
                                                Update the academic year and submission deadline for CMSP applications.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleAyDeadlineSubmit} className="space-y-4">
                                            {ayDeadlines.length > 0 && (
                                                <div className="space-y-2">
                                                    <Label htmlFor="ay-deadline-selector">Select action</Label>
                                                    <select
                                                        id="ay-deadline-selector"
                                                        value={selectedDeadlineId === 'new' ? 'new' : String(selectedDeadlineId)}
                                                        onChange={event => {
                                                            const value = event.target.value === 'new' ? 'new' : Number(event.target.value);
                                                            setAyFormFromSelection(value);
                                                        }}
                                                        className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-[#1e3c73] focus:outline-none focus:ring-2 focus:ring-[#1e3c73]/40 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                                                    >
                                                        <option value="new">Add new academic year</option>
                                                        {ayDeadlines.map(deadline => (
                                                            <option key={deadline.id} value={deadline.id}>
                                                                Edit AY {deadline.academic_year}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                            <div className="space-y-2">
                                                <Label htmlFor="ay-academic-year">Academic Year</Label>
                                                <Input
                                                    id="ay-academic-year"
                                                    value={ayFormData.academic_year}
                                                    onChange={event => setAyFormData('academic_year', event.target.value)}
                                                    placeholder="2025-2026"
                                                    required
                                                />
                                                {ayErrors.academic_year && (
                                                    <p className="text-red-500 text-sm">{ayErrors.academic_year}</p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="ay-deadline">Deadline</Label>
                                                <Input
                                                    id="ay-deadline"
                                                    type="date"
                                                    value={ayFormData.deadline}
                                                    onChange={event => setAyFormData('deadline', event.target.value)}
                                                    required
                                                />
                                                {ayErrors.deadline && (
                                                    <p className="text-red-500 text-sm">{ayErrors.deadline}</p>
                                                )}
                                            </div>
                                            <DialogFooter>
                                                <DialogClose asChild>
                                                    <Button type="button" variant="outline">Cancel</Button>
                                                </DialogClose>
                                                <Button type="submit" disabled={ayProcessing}>
                                                    {ayProcessing ? 'Saving...' : selectedDeadlineId === 'new' ? 'Add Academic Year' : 'Save Changes'}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                {ayDeadlines.length > 0 ? (
                                    <div
                                        className="max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 pr-2"
                                        style={{ maxWidth: '100%' }}
                                    >
                                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {ayDeadlines.map((deadline, idx) => (
                                                <div
                                                    key={deadline.id}
                                                    className="flex items-center gap-4 py-3 px-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition rounded-lg"
                                                >
                                                    <span className="text-xs text-gray-400 mr-2">{idx + 1}</span>
                                                    <div className="flex flex-1 flex-col">
                                                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">AY {deadline.academic_year}</span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                            {deadline.deadline_formatted ?? new Date(deadline.deadline).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                        </span>
                                                    </div>
                                                    <select
                                                        value={deadline.is_enabled ? 'enable' : 'disable'}
                                                        onChange={event => {
                                                            const isEnabled = event.target.value === 'enable';
                                                            void updateAyDeadlineStatus(deadline, isEnabled);
                                                        }}
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold ${deadline.is_enabled
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                        } border-none outline-none focus:ring-2 transition`}
                                                        style={{ minWidth: 120 }}
                                                    >
                                                        <option value="enable">Enable</option>
                                                        <option value="disable">Disable</option>
                                                    </select>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                                                        onClick={() => openAyDialog(deadline.id)}
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-gray-500 dark:text-gray-400 py-4 text-center">
                                        No academic year deadlines yet.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border">
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    </div> */}
                </div>

                {/* Users Table Section */}
                <div className="border-sidebar-border/70 dark:border-sidebar-border overflow-x-auto rounded-xl border p-4">
                    <Toaster
                        richColors
                        position="top-right"
                        closeButton
                        expand={false}
                        duration={4000}
                        toastOptions={{
                            style: {
                                borderRadius: '0.75rem',
                                boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.1)',
                                fontSize: '1rem',
                                fontFamily: 'var(--font-sans, Instrument Sans, sans-serif)',
                                padding: '1rem 3rem 1rem 1.25rem',
                                backdropFilter: 'blur(8px)',
                            },
                        }}
                    />
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
                        <Dialog open={open} onOpenChange={setOpen}>
                            <DialogTrigger asChild>
                                <Button className="group relative overflow-hidden bg-[#1e3c73] hover:bg-[#1a3565] text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#1a3565] to-[#1e3c73] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <UserRoundPlus className="mr-2 h-4 w-4 relative z-10 transition-transform group-hover:scale-110" />
                                    <span className="relative z-10">Create User</span>
                                </Button>
                            </DialogTrigger>

                            <DialogContent className="sm:max-w-[480px] border-0 shadow-2xl bg-white dark:bg-gray-900 rounded-2xl overflow-hidden">
                                {/* Header with gradient background */}
                                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 px-6 py-5 -mt-6 -mx-6 mb-6 border-b border-gray-200 dark:border-gray-700">
                                    <DialogHeader className="space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0 w-10 h-10 bg-[#1e3c73] hover:bg-[#1a3565] dark:bg-gray-100 rounded-xl flex items-center justify-center">
                                                <UserRoundPlus className="h-5 w-5 text-white dark:text-gray-900" />
                                            </div>
                                            <div>
                                                <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                                    Create New User
                                                </DialogTitle>
                                                <DialogDescription className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                                    Add a new user to manage the system
                                                </DialogDescription>
                                            </div>
                                        </div>
                                    </DialogHeader>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="px-6 space-y-5">
                                        {/* Name Field */}
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="name"
                                                className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2"
                                            >
                                                <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                                Full Name
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    type="text"
                                                    placeholder="Enter full name (e.g., Juan Dela Cruz)"
                                                    required
                                                    value={data.name}
                                                    onChange={e => setData('name', e.target.value)}
                                                    className={`pl-4 pr-4 py-3 border-2 rounded-xl transition-all duration-200 ${errors.name
                                                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                                        : 'border-gray-200 focus:border-gray-400 focus:ring-gray-200 dark:border-gray-600 dark:focus:border-gray-500'
                                                        } bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 focus:bg-white dark:focus:bg-gray-700`}
                                                />
                                            </div>
                                            {errors.name && (
                                                <div className="flex items-center gap-2 text-red-600 text-sm">
                                                    <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    <span>{errors.name}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Email Field */}
                                        <div className="space-y-2">
                                            <Label
                                                htmlFor="email"
                                                className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2"
                                            >
                                                <svg className="h-4 w-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                                </svg>
                                                Email Address
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="email"
                                                    name="email"
                                                    type="email"
                                                    placeholder="Enter email address"
                                                    required
                                                    value={data.email}
                                                    onChange={e => setData('email', e.target.value)}
                                                    className={`pl-4 pr-4 py-3 border-2 rounded-xl transition-all duration-200 ${errors.email
                                                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                                        : 'border-gray-200 focus:border-gray-400 focus:ring-gray-200 dark:border-gray-600 dark:focus:border-gray-500'
                                                        } bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 focus:bg-white dark:focus:bg-gray-700`}
                                                />
                                            </div>
                                            {errors.email && (
                                                <div className="flex items-center gap-2 text-red-600 text-sm">
                                                    <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                    </svg>
                                                    <span>{errors.email}</span>
                                                </div>
                                            )}
                                        </div>



                                    </div>

                                    {/* Footer */}
                                    <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 -mb-6 -mx-6 border-t border-gray-200 dark:border-gray-700">
                                        <DialogFooter className="gap-3">
                                            <DialogClose asChild>
                                                <Button
                                                    variant="outline"
                                                    type="button"
                                                    className="px-6 py-2.5 border-2 border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 rounded-xl dark:border-gray-600 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:bg-gray-700"
                                                >
                                                    Cancel
                                                </Button>
                                            </DialogClose>
                                            <Button
                                                type="submit"
                                                disabled={processing || !data.name || !data.email}
                                                className="px-6 py-2.5 bg-[#1e3c73] hover:bg-[#1a3565] dark:bg-gray-100 dark:text-gray-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-900 min-w-[120px]"
                                            >
                                                {processing ? (
                                                    <div className="flex items-center gap-2">
                                                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        <span>Creating...</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 ">
                                                        <UserRoundPlus className="h-4 w-4" />
                                                        <span>Create User</span>
                                                    </div>
                                                )}
                                            </Button>
                                        </DialogFooter>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>

                        <Button
                            className="group relative overflow-hidden bg-black hover:bg-neutral-900 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                            onClick={async () => {
                                setLoadingDeleted(true);
                                setDeletedDialogOpen(true);
                                try {
                                    const res = await fetch(route('users.trashed'), {
                                        headers: { Accept: 'application/json' }
                                    });
                                    const data = await res.json();
                                    setDeletedUsers(data.users);
                                } catch (e) {
                                    toast.error("Failed to fetch deleted users");
                                }
                                setLoadingDeleted(false);

                            }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-black to-neutral-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <UserRoundX className="mr-2 h-4 w-4 relative z-10 transition-transform group-hover:scale-110" />
                            <span className="relative z-10">Deleted</span>
                        </Button>

                    </div>

                    <form onSubmit={handleSearch} className="mb-4 mt-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                            {/* Search Section */}
                            <div className="flex gap-2 flex-1 max-w-sm">
                                <div className="relative flex-1">
                                    <input
                                        id='search'
                                        type="text"
                                        value={search ?? ''}
                                        onChange={e => setSearch(e.target.value)}
                                        placeholder="Search name or email..."
                                        className="w-full pl-8 pr-8 py-1.5 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-1 focus:ring-[#1e3c73] focus:border-transparent outline-none transition-all duration-200 placeholder-gray-500 dark:placeholder-gray-400"
                                    />
                                    <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearch('');
                                                router.get('role_management', { search: '', sortBy, sortDir, perPage }, { preserveState: true, preserveScroll: true });
                                            }}
                                            className="absolute right-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 p-0.5"
                                            aria-label="Clear search"
                                        >
                                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    className="group relative overflow-hidden bg-[#1e3c73] hover:bg-[#1a3565] text-white px-3 py-1.5 rounded-md transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-[#1e3c73]"
                                >
                                    <Search className="h-3.5 w-3.5 transition-transform group-hover:scale-110" />
                                </button>
                            </div>

                            {/* Entries Per Page Section */}
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <span className="whitespace-nowrap">Show:</span>
                                <select id="per-page"
                                    value={perPage}
                                    onChange={handlePerPageChange}
                                    className="appearance-none bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1.5 pr-6 text-sm focus:ring-1 focus:ring-[#1e3c73] focus:border-transparent outline-none transition-all duration-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                        </div>
                    </form>

                    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <TableHead
                                        className="font-semibold text-gray-900 dark:text-gray-100"
                                    >
                                        <div className="flex items-center gap-2">
                                            No.
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer select-none font-semibold text-gray-900 dark:text-gray-100 hover:text-[#1e3c73] dark:hover:text-[#3b5fa8] transition-colors duration-200 group"
                                        onClick={() => handleSort('name')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Name
                                            <div className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                                </svg>
                                            </div>
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer select-none font-semibold text-gray-900 dark:text-gray-100 hover:text-[#1e3c73] dark:hover:text-[#3b5fa8] transition-colors duration-200 group"
                                        onClick={() => handleSort('email')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Email
                                            <div className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                                </svg>
                                            </div>
                                        </div>
                                    </TableHead>
                                    <TableHead
                                        className="cursor-pointer select-none font-semibold text-gray-900 dark:text-gray-100 hover:text-[#1e3c73] dark:hover:text-[#3b5fa8] transition-colors duration-200 group"
                                        onClick={() => handleSort('region')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Region
                                            <div className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                                </svg>
                                            </div>
                                        </div>
                                    </TableHead>
                                    <TableHead>Roles</TableHead>
                                    <TableHead
                                        className="cursor-pointer select-none font-semibold text-gray-900 dark:text-gray-100 hover:text-[#1e3c73] dark:hover:text-[#3b5fa8] transition-colors duration-200 group"
                                        onClick={() => handleSort('created_at')}
                                    >
                                        <div className="flex items-center gap-2">
                                            Date Created
                                            <div className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                                </svg>
                                            </div>
                                        </div>
                                    </TableHead>
                                    <TableHead className="font-semibold text-gray-900 dark:text-gray-100">
                                        Action
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.data.map((user, idx) => (
                                    <TableRow
                                        key={user.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-150 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                    >
                                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                                            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
                                                {(users.current_page - 1) * users.per_page + idx + 1}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                                            <div className="flex items-center gap-3">

                                                <span>{user.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-700 dark:text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                                </svg>
                                                {user.email}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-700 dark:text-gray-300">
                                            {user.region ? (
                                                <span
                                                    className={user.region.status === 'inactive' ? 'text-red-600' : ''}
                                                >
                                                    {user.region.region}
                                                    {user.region.status === 'inactive' && (
                                                        <span className="ml-1 text-xs font-normal">(inactive)</span>
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="italic text-gray-400">No region</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-gray-700 dark:text-gray-300">
                                            {user.roles && user.roles.length > 0 ? (
                                                <span>
                                                    {user.roles.map(r => (
                                                        <span
                                                            key={r.id}
                                                            className={`
                        px-2 py-0.5 rounded-full text-xs mr-1
                        ${r.status === 'inactive'
                                                                    ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                                                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                                                                }
                    `}
                                                        >
                                                            {r.role}
                                                            {r.status === 'inactive' ? ' (inactive)' : ''}
                                                        </span>
                                                    ))}
                                                </span>
                                            ) : (
                                                <span className="italic text-gray-400">No roles</span>
                                            )}
                                        </TableCell>



                                        <TableCell className="text-gray-600 dark:text-gray-400">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">

                                                    <CalendarClock className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" />
                                                    <span className="text-sm font-medium">
                                                        {user.created_at && (() => {
                                                            const d = new Date(user.created_at);
                                                            return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
                                                        })()}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-500 ml-6">
                                                    {user.created_at && (() => {
                                                        const d = new Date(user.created_at);
                                                        return `${(d.getHours() % 12 || 12).toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
                                                    })()}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                className="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 px-3 py-1 rounded-md transition"
                                                title="Reset Password"
                                                onClick={() => {
                                                    router.post(route('users.resetPassword', user.id), {}, {
                                                        preserveScroll: true,
                                                        preserveState: true,
                                                        onSuccess: () => {
                                                            toast.success(`Password reset for ${user.name}!`, {
                                                                description: "Default password: 12345678",
                                                            });
                                                        },
                                                        onError: () => {
                                                            toast.error("Failed to reset password.");
                                                        },
                                                    });
                                                }}
                                            >
                                               <KeyRound  className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-1 rounded-md transition"
                                                title="Edit"
                                                onClick={() => {
                                                    setUserToEdit(user);
                                                    setEditData({
                                                        name: user.name,
                                                        email: user.email,
                                                        region_id: user.region_id || '',
                                                        role_ids: user.roles?.map(r => r.id) || []
                                                    });
                                                    setEditErrors({});
                                                    setEditDialogOpen(true);
                                                }}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-1 rounded-md transition"
                                                title="Delete"
                                                onClick={() => {
                                                    setUserToDelete(user);
                                                    setDeleteDialogOpen(true);
                                                }}
                                            >
                                                <UserRoundX className="w-4 h-4" />
                                            </Button>

                                        </TableCell>

                                    </TableRow>
                                ))}
                                {users.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">

                                                    <UserX className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-gray-500 dark:text-gray-400 font-medium">No users found</p>
                                                    <p className="text-sm text-gray-400 dark:text-gray-500">Try adjusting your search criteria</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-wrap justify-center gap-1 mt-6 p-3 bg-white dark:bg-gray-900 rounded-lg ">
                        {users.links.map((link, i) =>
                            <button
                                key={i}
                                onClick={() => gotoPage(link.url)}
                                disabled={!link.url || link.active}
                                className={`
                min-w-[2.25rem] h-8 px-2 text-sm font-medium rounded-md transition-all duration-200 
                focus:outline-none focus:ring-1 focus:ring-[#1e3c73] 
                disabled:cursor-not-allowed
                ${link.active
                                        ? 'bg-[#1e3c73] text-white shadow-sm'
                                        : link.url
                                            ? 'bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
                                    }
            `}
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        )}
                    </div>

                </div>


            </div>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <b>{userToDelete?.name}</b>?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={() => {
                                if (userToDelete) {
                                    router.delete(route('users.destroy', userToDelete.id), {
                                        preserveState: true,
                                        preserveScroll: true,
                                        onSuccess: () => {
                                            toast.success('User deleted!');
                                            setDeleteDialogOpen(false);
                                            setUserToDelete(null);
                                        },
                                        onError: () => {
                                            toast.error('Failed to delete user.');
                                        },
                                    });
                                }
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                        <DialogDescription>
                            Update the user's name and email address.
                        </DialogDescription>
                    </DialogHeader>
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            setEditProcessing(true);
                            setEditErrors({});
                            router.put(
                                route('users.update', userToEdit?.id),
                                { ...editData },
                                {
                                    preserveScroll: true,
                                    preserveState: true,
                                    onSuccess: () => {
                                        toast.success('User updated!');
                                        setEditDialogOpen(false);
                                        setUserToEdit(null);
                                    },
                                    onError: (errors) => {
                                        setEditErrors(errors);
                                        toast.error('Failed to update user.');
                                    },
                                    onFinish: () => setEditProcessing(false),
                                }
                            );
                        }}
                        className="space-y-4"
                    >
                        <div>
                            <Label htmlFor="edit-name">Name</Label>
                            <Input
                                id="edit-name"
                                name="edit-name"
                                type="text"
                                value={editData.name}
                                onChange={e => setEditData(d => ({ ...d, name: e.target.value }))}
                                className={editErrors.name ? "border-red-400" : ""}
                                required
                            />
                            {editErrors.name && <p className="text-red-600 text-sm">{editErrors.name}</p>}
                        </div>
                        <div>
                            <Label htmlFor="edit-email">Email</Label>
                            <Input
                                id="edit-email"
                                name="edit-email"
                                type="email"
                                value={editData.email}
                                onChange={e => setEditData(d => ({ ...d, email: e.target.value }))}
                                className={editErrors.email ? "border-red-400" : ""}
                                required
                            />
                            {editErrors.email && <p className="text-red-600 text-sm">{editErrors.email}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label
                                htmlFor="edit-region"
                                className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2"
                            >

                                Region
                            </Label>
                            <div className="relative">
                                <select
                                    id="edit-region"
                                    name="edit-region"
                                    value={editData.region_id}
                                    onChange={e => setEditData(d => ({ ...d, region_id: e.target.value }))}
                                    className={`appearance-none pl-4 pr-8 py-2.5 border-2 rounded-xl transition-all duration-200
        text-base
        ${editErrors.region_id
                                            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                                            : 'border-gray-200 focus:border-gray-400 focus:ring-gray-200 dark:border-gray-600 dark:focus:border-gray-500'
                                        }
        bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 focus:bg-white dark:focus:bg-gray-700
        w-full
    `}
                                    required={false}
                                    style={{ height: '46px' }}
                                >
                                    <option value="">No Region</option>
                                    {regions.map(region => (
                                        <option
                                            key={region.id}
                                            value={region.id}
                                            style={region.status === 'inactive'
                                                ? { color: '#dc2626', fontWeight: 'bold' } // Tailwind red-600
                                                : {}
                                            }
                                        >
                                            {region.region}
                                            {region.status === 'inactive' ? ' (inactive)' : ''}
                                        </option>
                                    ))}
                                </select>


                                {/* Custom dropdown arrow */}
                                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                            {editErrors.region_id && <p className="text-red-600 text-sm">{editErrors.region_id}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="edit-roles">Roles</Label>
                            <select
                                id="edit-roles"
                                name="edit-roles"
                                value={editData.role_ids}
                                onChange={e =>
                                    setEditData(d => ({
                                        ...d,
                                        role_ids: Array.from(e.target.selectedOptions, option => option.value)
                                    }))
                                }
                                multiple
                                className="appearance-none pl-4 pr-8 py-2.5 border-2 rounded-xl transition-all duration-200 text-base bg-gray-50 dark:bg-gray-800 hover:bg-white dark:hover:bg-gray-700 focus:bg-white dark:focus:bg-gray-700 w-full"
                                style={{ height: '90px' }}
                            >


                                {roles.map(role => (
                                    <option
                                        key={role.id}
                                        value={role.id}
                                        style={role.status === 'inactive'
                                            ? { color: '#dc2626', fontWeight: 'bold' }
                                            : {}
                                        }
                                    >
                                        {role.role}
                                        {role.status === 'inactive' ? ' (inactive)' : ''}
                                    </option>
                                ))}
                            </select>
                            {editErrors.role_ids && <p className="text-red-600 text-sm">{editErrors.role_ids}</p>}
                        </div>




                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={editProcessing}>
                                {editProcessing ? 'Updating...' : 'Update'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog open={deletedDialogOpen} onOpenChange={setDeletedDialogOpen}>
                <DialogContent className="sm:max-w-[800px]">
                    <DialogHeader>
                        <DialogTitle>Deleted Users</DialogTitle>
                        <DialogDescription>
                            View and restore deleted users.
                        </DialogDescription>
                    </DialogHeader>
                    {loadingDeleted ? (
                        <div className="py-6 flex items-center justify-center">Loading...</div>
                    ) : deletedUsers && deletedUsers.data.length > 0 ? (
                        <div className="max-h-80 overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>No.</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Deleted At</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {deletedUsers.data.map((user, idx) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                {(deletedUsers.current_page - 1) * deletedUsers.per_page + idx + 1}
                                            </TableCell>
                                            <TableCell>{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                {/* If your model has deleted_at as string */}
                                                {user.deleted_at
                                                    ? new Date(user.deleted_at).toLocaleString()
                                                    : ''}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    className="text-green-700 border-green-600"
                                                    variant="outline"
                                                    onClick={async () => {
                                                        try {
                                                            await router.post(
                                                                route('users.restore', user.id),
                                                                {},
                                                                {
                                                                    preserveScroll: true,
                                                                    preserveState: true,
                                                                    onSuccess: () => {
                                                                        toast.success('User restored!');
                                                                        // Remove user from the deletedUsers state
                                                                        setDeletedUsers((prev) =>
                                                                            prev
                                                                                ? {
                                                                                    ...prev,
                                                                                    data: prev.data.filter(u => u.id !== user.id)
                                                                                }
                                                                                : prev
                                                                        );
                                                                    },
                                                                    onError: () => {
                                                                        toast.error('Failed to restore user.');
                                                                    }
                                                                }
                                                            );
                                                        } catch {
                                                            toast.error('Failed to restore user.');
                                                        }
                                                    }}
                                                >
                                                    Restore
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="py-8 text-center text-gray-500">No deleted users found.</div>
                    )}
                </DialogContent>
            </Dialog>



        </AppLayout>
    );
}

import { type BreadcrumbItem, type SharedData } from '@/types';
import { Transition } from '@headlessui/react';
import { Head, Link, useForm, usePage, router } from '@inertiajs/react';
import { FormEventHandler, useRef, useState, useEffect } from 'react';
import DeleteUser from '@/components/delete-user';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Camera, Trash2 } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Profile settings', href: '/settings/profile' },
];

export default function Profile({ mustVerifyEmail, status }: { mustVerifyEmail: boolean; status?: string }) {
    const { auth } = usePage<SharedData>().props;

    const [currentPhotoPath, setCurrentPhotoPath] = useState<string | null>(
        auth.user.profile_photo_path as string | null,
    );
    // keep in sync with any prop updates (uploads/removals)
    useEffect(() => {
        setCurrentPhotoPath(auth.user.profile_photo_path as string | null);
    }, [auth.user.profile_photo_path]);

    // Get initials: first letter of first and last word
    const nameParts = auth.user.name.trim().split(/\s+/);
    const initials = nameParts.length > 1
        ? (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase()
        : nameParts[0].charAt(0).toUpperCase();

    // Form for name/email
    const infoForm = useForm<{ name: string; email: string }>({
        name: auth.user.name,
        email: auth.user.email,
    });

    // Form for photo
    const [preview, setPreview] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const photoForm = useForm<{ photo?: File }>({ photo: undefined });

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Only allow image types
        if (!file.type.startsWith('image/')) {
            photoForm.setError('photo', 'Please select a valid image file.');
            setPreview(null);
            return;
        }

        // 2 MB = 2 * 1024 * 1024 bytes
        if (file.size > 2 * 1024 * 1024) {
            photoForm.setError('photo', 'The selected image must be less than 2 MB.');
            setPreview(null);
            return;
        }

        // clear any prior file errors
        photoForm.clearErrors('photo');

        photoForm.setData('photo', file);
        setPreview(URL.createObjectURL(file));
        setCurrentPhotoPath(null);
    };

    const submitInfo: FormEventHandler = (e) => {
        e.preventDefault();
        infoForm.patch(route('profile.update'), { preserveScroll: true });
    };

    const submitPhoto: FormEventHandler = (e) => {
        e.preventDefault();
        photoForm.post(route('profile.update.photo'), {
            preserveScroll: true,
            onSuccess: () => {
                // clear out preview  file so the Save button disables again
                setPreview(null);
                photoForm.setData('photo', undefined);
            },
        });
    };

    const removePhoto = () => {
        photoForm.delete(route('profile.destroy.photo'), {
            preserveScroll: true,
            onSuccess: () => {
                setPreview(null);
                setCurrentPhotoPath(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <SettingsLayout>
                {/* Profile Photo Form */}
                <div className="space-y-6 mt-8">
                    <HeadingSmall
                        title="Profile photo"
                        description="Upload, change, or remove your profile image"
                    />

                    <form
                        onSubmit={submitPhoto}
                        encType="multipart/form-data"
                        className="space-y-6"
                    >
                        <div className="flex items-center space-x-4">
                            {preview ? (
                                <img
                                    src={preview}
                                    alt="Selected photo"
                                    className="h-20 w-20 rounded-full object-cover"
                                />
                            ) : currentPhotoPath ? (
                                <img
                                    src={`/storage/${currentPhotoPath}`}
                                    alt="Profile photo"
                                    className="h-20 w-20 rounded-full object-cover"
                                />
                            ) : (
                                <div className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-2xl uppercase text-gray-700 dark:text-gray-200">
                                    {initials}
                                </div>
                            )}

                            <div className="flex space-x-2">
                                {/* Change Photo Icon */}
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.click()}
                                    className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                                    aria-label="Change photo"
                                >
                                    <Camera className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                                </button>

                                {/* Remove Photo Icon */}
                                {(currentPhotoPath || preview) && (
                                    <button
                                        type="button"
                                        onClick={removePhoto}
                                        className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-700 transition"
                                        aria-label="Remove photo"
                                    >
                                        <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    </button>
                                )}
                            </div>

                            <input
                                ref={inputRef}
                                type="file"
                                name="photo"
                                accept="image/*"
                                className="hidden"
                                onChange={onFileChange}
                            />
                            <InputError message={photoForm.errors.photo} className="mt-2" />
                        </div>

                        <div className="flex items-center gap-4">
                            <Button type="submit" disabled={!photoForm.data.photo || photoForm.processing}>
                                Save Photo
                            </Button>
                            <Transition
                                show={photoForm.recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm text-neutral-600">Saved</p>
                            </Transition>
                        </div>
                    </form>
                </div>

                {/* Profile Info Form */}
                <div className="space-y-6">
                    <HeadingSmall title="Profile information" description="Update your name and email address" />
                    <form onSubmit={submitInfo} className="space-y-6">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                className="mt-1 block w-full"
                                value={infoForm.data.name}
                                onChange={(e) => infoForm.setData('name', e.target.value)}
                                required
                                autoComplete="name"
                                placeholder="Full name"
                            />
                            <InputError message={infoForm.errors.name} className="mt-2" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email address</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                className="mt-1 block w-full"
                                value={infoForm.data.email}
                                onChange={(e) => infoForm.setData('email', e.target.value)}
                                required
                                autoComplete="username"
                                placeholder="Email address"
                            />
                            <InputError message={infoForm.errors.email} className="mt-2" />
                        </div>
                        {mustVerifyEmail && auth.user.email_verified_at === null && (
                            <div>
                                <p className="-mt-4 text-sm text-muted-foreground">
                                    Your email address is unverified.{' '}
                                    <Link href={route('verification.send')} method="post" as="button" className="underline">
                                        Click here to resend the verification email.
                                    </Link>
                                </p>
                                {status === 'verification-link-sent' && (
                                    <div className="mt-2 text-sm text-green-600">
                                        A new verification link has been sent to your email address.
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="flex items-center gap-4">
                            <Button type="submit" disabled={infoForm.processing}>Save</Button>
                            <Transition show={infoForm.recentlySuccessful} enter="transition ease-in-out" enterFrom="opacity-0" leave="transition ease-in-out" leaveTo="opacity-0">
                                <p className="text-sm text-neutral-600">Saved</p>
                            </Transition>
                        </div>
                    </form>
                </div>

                {/* Delete User */}
                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}

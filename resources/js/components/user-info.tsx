import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { type User } from '@/types';

export function UserInfo({ user, showEmail = false }: { user: User; showEmail?: boolean }) {
  const getInitials = useInitials();

  // Determine the avatar URL: prefer a full URL if provided, otherwise build from storage path
  const avatarSrc =
    // Jetstream's provided full URL for profile photo, if available
    (user as any).profile_photo_url ||
    // Fallback to storage path
    (user.profile_photo_path ? `/storage/${user.profile_photo_path}` : undefined);

  return (
    <>
      <Avatar key={avatarSrc ?? 'no-avatar'} className="h-8 w-8 overflow-hidden rounded-full">
        {avatarSrc ? (
          <AvatarImage src={avatarSrc} alt={user.name} />
        ) : null}
        <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{user.name}</span>
        {showEmail && <span className="truncate text-xs text-muted-foreground">{user.email}</span>}
      </div>
    </>
  );
}

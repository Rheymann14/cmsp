import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { Loader2, CalendarRange, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Toaster, toast } from 'sonner';

/* ----------------------------------------------------------
   CSRF helpers: warm up XSRF-TOKEN and a safe fetch wrapper
---------------------------------------------------------- */

let _csrfWarmup: Promise<void> | null = null;
const ensureCsrfCookie = (force = false) => {
  const hasCookie = typeof document !== 'undefined' && document.cookie.includes('XSRF-TOKEN=');
  if (!force && hasCookie) return Promise.resolve();
  if (_csrfWarmup) return _csrfWarmup;
  _csrfWarmup = fetch('/sanctum/csrf-cookie', { credentials: 'same-origin' })
    .then(() => void 0)
    .finally(() => {
      _csrfWarmup = null;
    });
  return _csrfWarmup;
};

const getXsrfToken = () => {
  const m = typeof document !== 'undefined'
    ? document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)
    : null;
  return m ? decodeURIComponent(m[1]) : '';
};

const csrfFetch = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  await ensureCsrfCookie();
  const token = getXsrfToken();

  const doFetch = () =>
    fetch(input, {
      ...init,
      credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(token ? { 'X-XSRF-TOKEN': token } : {}),
        ...(init.headers || {}),
      },
    });

  let res = await doFetch();
  if (res.status === 419) {
    await ensureCsrfCookie(true);
    res = await doFetch();
  }
  return res;
};

/* ---------------------------------------------------------- */

const breadcrumbs: BreadcrumbItem[] = [
  { title: 'Report', href: '/reports' },
];

const toStringOrEmpty = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  if (value === null || value === undefined) {
    return '';
  }
  return String(value);
};

interface DeadlineOption {
  id: number;
  academic_year: string;
  deadline: string;
  deadline_formatted: string;
  is_enabled: boolean;
  new_slots: number;
}

interface SummaryResponse {
  totals: {
    applicants: number;
    qualified_applicants: number;
  };
  rank_counts: { rank: number; count: number }[];
  special_groups: { name: string; count: number; ranks: number[] }[];
}

interface SpecialGroupDetailApplicant {
  tracking_no: string;
  lrn: string;
  name: string;
  rank: number;
}

interface SpecialGroupDetailsResponse {
  group: string;
  rank?: number | null;
  ranks?: number[];
  applicants: SpecialGroupDetailApplicant[];
}

const EMPTY_SUMMARY: SummaryResponse = {
  totals: { applicants: 0, qualified_applicants: 0 },
  rank_counts: [],
  special_groups: [],
};

type ZiggyRouteFn = (name: string, params?: unknown) => string;
type ZiggyWindow = typeof window & { route?: ZiggyRouteFn };

const resolveRoute = (name: string, params?: unknown, fallback?: string) => {
  try {
    const { route } = window as ZiggyWindow;
    if (typeof route === 'function') {
      return route(name, params);
    }
  } catch {
    /* ignore */
  }
  return fallback || '/';
};

const toPath = (href: string) => {
  try {
    const u = new URL(href, window.location.origin);
    return u.pathname + u.search + u.hash;
  } catch {
    return href;
  }
};

const parseAyDeadlines = (input: unknown): DeadlineOption[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input.reduce<DeadlineOption[]>((acc, item) => {
    if (!item || typeof item !== 'object') {
      return acc;
    }

    const raw = item as Record<string, unknown>;
    const rawId = raw.id;
    const parsedId =
      typeof rawId === 'number'
        ? rawId
        : Number.parseInt(typeof rawId === 'string' ? rawId : String(rawId ?? ''), 10);

    if (!Number.isFinite(parsedId)) {
      return acc;
    }

    acc.push({
      id: parsedId,
      academic_year: toStringOrEmpty(raw.academic_year),
      deadline: toStringOrEmpty(raw.deadline),
      deadline_formatted: toStringOrEmpty(raw.deadline_formatted),
      is_enabled: Boolean(raw.is_enabled),
      new_slots:
        typeof raw.new_slots === 'number'
          ? Math.max(0, Math.trunc(raw.new_slots))
          : (() => {
              const parsedSlots = Number.parseInt(
                typeof raw.new_slots === 'string' ? raw.new_slots : String(raw.new_slots ?? ''),
                10,
              );
              return Number.isFinite(parsedSlots) ? Math.max(0, parsedSlots) : 0;
            })(),
    });

    return acc;
  }, []);
};

export default function ReportPage() {
  const [deadlines, setDeadlines] = useState<DeadlineOption[]>([]);
  const [loadingDeadlines, setLoadingDeadlines] = useState(false);
  const [deadlinesError, setDeadlinesError] = useState<string | null>(null);

  const [selectedDeadlineId, setSelectedDeadlineId] = useState<number | null>(null);
  const [deadlineDialogOpen, setDeadlineDialogOpen] = useState(false);

  const [summary, setSummary] = useState<SummaryResponse>(EMPTY_SUMMARY);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [newSlots, setNewSlots] = useState<string>('');
  const [savingNewSlots, setSavingNewSlots] = useState(false);

  const [groupDetailsDialogOpen, setGroupDetailsDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groupDetails, setGroupDetails] = useState<SpecialGroupDetailApplicant[]>([]);
  const [groupDetailsMeta, setGroupDetailsMeta] = useState<{ group: string; ranks: number[] } | null>(null);
  const [groupDetailsLoading, setGroupDetailsLoading] = useState(false);
  const [groupDetailsError, setGroupDetailsError] = useState<string | null>(null);
  const groupDetailsRequestId = useRef(0);

  // Warm the CSRF cookie once on first mount (handles "first request after login")
  useEffect(() => {
    ensureCsrfCookie();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadDeadlines = async () => {
      setLoadingDeadlines(true);
      setDeadlinesError(null);
      try {
        const url = toPath(resolveRoute('ay-deadlines.index', undefined, '/ay-deadlines'));
        const res = await fetch(url, {
          headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          credentials: 'same-origin',
        });

        if (!res.ok) {
          throw new Error('Failed to load academic year deadlines.');
        }

        const json = (await res.json()) as { deadlines?: unknown };
        const parsed = parseAyDeadlines(json.deadlines ?? []);
        if (cancelled) {
          return;
        }

        setDeadlines(parsed);
        setSelectedDeadlineId((current) => {
          if (current !== null && parsed.some((deadline) => deadline.id === current)) {
            return current;
          }

          const preferred = parsed.find((deadline) => deadline.is_enabled) ?? parsed[0] ?? null;
          return preferred ? preferred.id : null;
        });
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setDeadlinesError('Unable to load academic year deadlines.');
          setDeadlines([]);
          setSelectedDeadlineId(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingDeadlines(false);
        }
      }
    };

    loadDeadlines();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!deadlines.length) {
      setSelectedDeadlineId(null);
      return;
    }

    if (selectedDeadlineId === null || !deadlines.some((deadline) => deadline.id === selectedDeadlineId)) {
      const preferred = deadlines.find((deadline) => deadline.is_enabled) ?? deadlines[0] ?? null;
      setSelectedDeadlineId(preferred ? preferred.id : null);
    }
  }, [deadlines, selectedDeadlineId]);

  const selectedDeadline = useMemo(
    () => deadlines.find((deadline) => deadline.id === selectedDeadlineId) ?? null,
    [deadlines, selectedDeadlineId],
  );

  const selectedAcademicYear = selectedDeadline?.academic_year ?? '';

  const selectedDeadlineValue = useMemo(() => {
    if (!selectedDeadline?.deadline) {
      return '';
    }
    const match = selectedDeadline.deadline.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    return match ?? selectedDeadline.deadline;
  }, [selectedDeadline?.deadline]);

  useEffect(() => {
    if (!selectedDeadline) {
      setNewSlots('');
      return;
    }

    const normalized = selectedDeadline.new_slots > 0 ? String(selectedDeadline.new_slots) : '';
    setNewSlots((current) => {
      const trimmed = current.trim();
      if (trimmed === '') {
        return normalized;
      }

      const parsedCurrent = Number.parseInt(trimmed.replace(/[^0-9]/g, ''), 10);
      const normalizedCurrent = Number.isFinite(parsedCurrent) ? String(parsedCurrent) : '';

      return normalizedCurrent === normalized ? current : normalized;
    });
  }, [selectedDeadline?.id, selectedDeadline?.new_slots]);

  const buildSummaryUrl = useCallback((academicYear: string, deadline: string) => {
    const basePath = toPath(resolveRoute('reports.summary', undefined, '/reports/summary'));
    const u = new URL(basePath, window.location.origin);
    if (academicYear.trim()) {
      u.searchParams.set('academic_year', academicYear.trim());
    }
    if (deadline.trim()) {
      u.searchParams.set('deadline', deadline.trim());
    }
    return u.pathname + u.search + u.hash;
  }, []);

  const buildSpecialGroupDetailsUrl = useCallback(
    (academicYear: string, deadline: string, group: string, rank?: number | null) => {
      const basePath = toPath(
        resolveRoute('reports.special-group-details', undefined, '/reports/special-group-details'),
      );
      const u = new URL(basePath, window.location.origin);
      if (academicYear.trim()) {
        u.searchParams.set('academic_year', academicYear.trim());
      }
      if (deadline.trim()) {
        u.searchParams.set('deadline', deadline.trim());
      }
      u.searchParams.set('group', group.trim());
      if (typeof rank === 'number' && Number.isFinite(rank) && rank > 0) {
        u.searchParams.set('rank', String(rank));
      }
      return u.pathname + u.search + u.hash;
    },
    [],
  );

  useEffect(() => {
    if (!selectedDeadline) {
      setSummary(EMPTY_SUMMARY);
      return;
    }

    let cancelled = false;

    const loadSummary = async () => {
      setSummaryLoading(true);
      setSummaryError(null);
      try {
        const res = await fetch(buildSummaryUrl(selectedAcademicYear, selectedDeadlineValue), {
          headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          credentials: 'same-origin',
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => '');
          throw new Error(`Failed to load report summary (HTTP ${res.status}). ${txt.slice(0, 300)}`);
        }

        const json = (await res.json()) as SummaryResponse;
        if (!cancelled) {
          setSummary(json);
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
          setSummaryError(
            error instanceof Error ? error.message : 'Unable to load report summary for the selected period.',
          );
          setSummary(EMPTY_SUMMARY);
        }
      }
      finally {
        if (!cancelled) {
          setSummaryLoading(false);
        }
      }
    };

    loadSummary();
    return () => {
      cancelled = true;
    };
  }, [buildSummaryUrl, selectedAcademicYear, selectedDeadline, selectedDeadlineValue]);

  const rankColumns = useMemo(() => {
    if (!summary.rank_counts.length) {
      return [] as { rank: number; count: number }[][];
    }
    const columns = 3;
    const perColumn = Math.ceil(summary.rank_counts.length / columns);
    return Array.from({ length: columns }, (_, index) =>
      summary.rank_counts.slice(index * perColumn, (index + 1) * perColumn),
    ).filter((col) => col.length > 0);
  }, [summary.rank_counts]);

  const totalRankedApplicants = useMemo(
    () => summary.rank_counts.reduce((acc, item) => acc + item.count, 0),
    [summary.rank_counts],
  );

  const formattedNewSlots = useMemo(() => {
    const parsed = Number.parseInt(newSlots.replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [newSlots]);

  const slotMatchesSaved = useMemo(
    () => (!selectedDeadline ? formattedNewSlots === 0 : formattedNewSlots === selectedDeadline.new_slots),
    [formattedNewSlots, selectedDeadline],
  );

  const handleNewSlotsSubmit = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();

      if (!selectedDeadline) {
        toast.error('Select an academic year before adding new slots.');
        return;
      }

      if (slotMatchesSaved) {
        toast.info('No changes to save for the selected academic year.');
        return;
      }

      if (formattedNewSlots < 0) {
        toast.error('Enter a valid number of new slots.');
        return;
      }

      if (savingNewSlots) {
        return;
      }

      const deadlineId = selectedDeadline.id;
      const academicYearLabel = selectedDeadline.academic_year
        ? `AY ${selectedDeadline.academic_year}`
        : 'the selected year';

      try {
        setSavingNewSlots(true);

        const url = toPath(
          resolveRoute(
            'ay-deadlines.updateSlots',
            { ayDeadline: deadlineId },
            `/ay-deadlines/${deadlineId}/slots`,
          ),
        );

        const response = await csrfFetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ new_slots: formattedNewSlots }),
        });

        const responseText = await response.text();
        let responseJson: unknown = null;
        if (responseText.trim() !== '') {
          try {
            responseJson = JSON.parse(responseText);
          } catch {
            responseJson = null;
          }
        }

        if (!response.ok) {
          let message = 'Failed to save the new slots.';

          if (responseJson && typeof responseJson === 'object') {
            const json = responseJson as {
              message?: string;
              errors?: Record<string, unknown>;
            };

            if (typeof json.message === 'string') {
              message = json.message;
            } else if (json.errors && typeof json.errors === 'object') {
              for (const value of Object.values(json.errors)) {
                if (Array.isArray(value)) {
                  const firstString = value.find((item) => typeof item === 'string');
                  if (typeof firstString === 'string') {
                    message = firstString;
                    break;
                  }
                } else if (typeof value === 'string') {
                  message = value;
                  break;
                }
              }
            }
          } else if (responseText.trim() !== '') {
            message = responseText.slice(0, 200);
          }

          throw new Error(message);
        }

        const jsonPayload =
          responseJson && typeof responseJson === 'object'
            ? (responseJson as { deadline?: { new_slots?: unknown }; message?: unknown })
            : null;

        const updatedSlotsRaw = jsonPayload?.deadline?.new_slots;
        const updatedSlots =
          typeof updatedSlotsRaw === 'number'
            ? Math.max(0, Math.trunc(updatedSlotsRaw))
            : formattedNewSlots;

        const successMessage =
          typeof jsonPayload?.message === 'string'
            ? jsonPayload.message
            : `Added ${updatedSlots.toLocaleString()} new slot${updatedSlots === 1 ? '' : 's'} for ${academicYearLabel}.`;

        toast.success(successMessage);

        setDeadlines((current) =>
          current.map((deadline) =>
            deadline.id === deadlineId ? { ...deadline, new_slots: updatedSlots } : deadline,
          ),
        );

        setNewSlots(updatedSlots > 0 ? String(updatedSlots) : '');
      } catch (error) {
        console.error(error);
        const message =
          error instanceof Error ? error.message : 'Unable to save the new slots. Please try again.';
        toast.error(message);
      } finally {
        setSavingNewSlots(false);
      }
    },
    [
      formattedNewSlots,
      savingNewSlots,
      selectedDeadline,
      setDeadlines,
      setNewSlots,
      slotMatchesSaved,
    ],
  );

  const handleGroupRowClick = useCallback((groupName: string) => {
    const trimmedGroup = groupName.trim();
    if (!trimmedGroup) {
      toast.error('Unable to load details for this special group.');
      return;
    }

    setSelectedGroup(trimmedGroup);
    setGroupDetailsMeta({ group: trimmedGroup, ranks: [] });
    setGroupDetails([]);
    setGroupDetailsError(null);
    setGroupDetailsDialogOpen(true);
  }, []);

  const handleGroupDialogOpenChange = useCallback(
    (open: boolean) => {
      setGroupDetailsDialogOpen(open);
      if (!open) {
        groupDetailsRequestId.current += 1;
        setSelectedGroup(null);
        setGroupDetails([]);
        setGroupDetailsError(null);
        setGroupDetailsLoading(false);
        setGroupDetailsMeta(null);
      }
    },
    [],
  );

  useEffect(() => {
    if (!groupDetailsDialogOpen || !selectedGroup) {
      return;
    }

    const trimmedGroup = selectedGroup.trim();
    if (!trimmedGroup) {
      setGroupDetailsError('No special group selected.');
      setGroupDetails([]);
      return;
    }

    const requestId = ++groupDetailsRequestId.current;
    let cancelled = false;

    setGroupDetailsMeta({ group: trimmedGroup, ranks: [] });
    setGroupDetails([]);
    setGroupDetailsError(null);
    setGroupDetailsLoading(true);

    const loadDetails = async () => {
      try {
        const url = buildSpecialGroupDetailsUrl(
          selectedAcademicYear,
          selectedDeadlineValue,
          trimmedGroup,
        );
        const res = await fetch(url, {
          headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
          credentials: 'same-origin',
        });

        const responseText = await res.text();

        if (!res.ok) {
          let message = 'Failed to load special group details.';
          if (responseText.trim() !== '') {
            try {
              const parsed = JSON.parse(responseText) as { message?: string };
              if (parsed && typeof parsed.message === 'string') {
                message = parsed.message;
              }
            } catch {
              message = `${message} (HTTP ${res.status})`;
            }
          }
          throw new Error(message);
        }

        const json = responseText.trim()
          ? (JSON.parse(responseText) as SpecialGroupDetailsResponse)
          : null;

        if (!json || !Array.isArray(json.applicants)) {
          throw new Error('Unexpected response while loading special group details.');
        }

        if (!cancelled && groupDetailsRequestId.current === requestId) {
          const normalizedGroup =
            typeof json.group === 'string' && json.group.trim() ? json.group.trim() : trimmedGroup;
          const responseRanks = Array.isArray(json.ranks)
            ? json.ranks
                .map((value) => (typeof value === 'number' ? value : Number.parseInt(String(value), 10)))
                .filter((value) => Number.isFinite(value) && value > 0)
            : [];
          const applicantRanks = json.applicants
            .map((detail) => detail?.rank)
            .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);
          const normalizedRanks = Array.from(new Set([...responseRanks, ...applicantRanks])).sort(
            (a, b) => a - b,
          );

          setGroupDetails(json.applicants);
          setGroupDetailsMeta({
            group: normalizedGroup,
            ranks: normalizedRanks,
          });
        }
      } catch (error) {
        if (!cancelled && groupDetailsRequestId.current === requestId) {
          console.error(error);
          const message =
            error instanceof Error
              ? error.message
              : 'Unable to load details for this special group.';
          setGroupDetails([]);
          setGroupDetailsError(message);
        }
      } finally {
        if (!cancelled && groupDetailsRequestId.current === requestId) {
          setGroupDetailsLoading(false);
        }
      }
    };

    void loadDetails();

    return () => {
      cancelled = true;
    };
  }, [
    buildSpecialGroupDetailsUrl,
    groupDetailsDialogOpen,
    selectedAcademicYear,
    selectedDeadlineValue,
    selectedGroup,
  ]);

  const detailDialogGroup = groupDetailsMeta?.group ?? selectedGroup ?? 'Special group';
  const detailDialogRanks = groupDetailsMeta?.ranks ?? [];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Reports" />

      <Toaster richColors position="top-right" closeButton duration={4000} />

      <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Dialog open={deadlineDialogOpen} onOpenChange={setDeadlineDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                disabled={loadingDeadlines}
                className={cn(
                  'self-start gap-2 border-[#1e3c73] text-[#1e3c73] hover:bg-[#1e3c73]/10 dark:border-[#1e3c73] dark:text-zinc-100 dark:hover:bg-[#1e3c73]/20',
                  !selectedAcademicYear && 'opacity-90',
                )}
              >
                <CalendarRange className="h-4 w-4" />
                {selectedAcademicYear ? 'Change academic year' : 'Select academic year'}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px]">
              <DialogHeader>
                <DialogTitle>Select academic year</DialogTitle>
                <DialogDescription>
                  Choose an academic year deadline to filter the report data.
                </DialogDescription>
              </DialogHeader>
              <Command>
                <CommandInput placeholder="Search academic year..." />
                <CommandList>
                  <CommandEmpty>
                    {loadingDeadlines ? 'Loading deadlines...' : 'No academic year deadlines found.'}
                  </CommandEmpty>
                  {deadlines.length > 0 ? (
                    <CommandGroup heading="Academic year deadlines">
                      {deadlines.map((deadline) => (
                        <CommandItem
                          key={deadline.id}
                          value={`AY ${deadline.academic_year}`}
                          onSelect={() => {
                            setSelectedDeadlineId(deadline.id);
                            setDeadlineDialogOpen(false);
                          }}
                        >
                          <div className="flex flex-1 flex-col">
                            <span className="font-medium">AY {deadline.academic_year || '—'}</span>
                            <span className="text-xs text-muted-foreground">
                              {deadline.deadline_formatted
                                ? `Deadline: ${deadline.deadline_formatted}`
                                : deadline.deadline
                                  ? `Deadline: ${deadline.deadline}`
                                  : 'No deadline date'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {deadline.is_enabled ? (
                              <Badge variant="secondary" className="whitespace-nowrap">
                                Enabled
                              </Badge>
                            ) : null}
                            {selectedDeadlineId === deadline.id ? (
                              <Check className="h-4 w-4 text-[#1e3c73]" />
                            ) : null}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  ) : null}
                </CommandList>
              </Command>
            </DialogContent>
          </Dialog>

          <Dialog open={groupDetailsDialogOpen} onOpenChange={handleGroupDialogOpenChange}>
            <DialogContent className="sm:max-w-[720px]">
              <DialogHeader>
                <DialogTitle>{detailDialogGroup}</DialogTitle>
                <DialogDescription>
                  Applicants belonging to this special group
                  {detailDialogRanks.length
                    ? ` across rank${detailDialogRanks.length === 1 ? '' : 's'} ${detailDialogRanks
                        .map((rank) => `#${rank.toLocaleString()}`)
                        .join(', ')}`
                    : ' for the selected period.'}
                </DialogDescription>
              </DialogHeader>

              {detailDialogRanks.length ? (
                <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wide text-[#1e3c73] dark:text-zinc-100">
                    Ranks:
                  </span>
                  {detailDialogRanks.map((rank) => (
                    <span
                      key={rank}
                      className="inline-flex items-center rounded-full border border-[#1e3c73]/40 px-2 py-0.5 font-semibold text-[#1e3c73] dark:border-[#1e3c73]/60 dark:text-zinc-100"
                    >
                      #{rank.toLocaleString()}
                    </span>
                  ))}
                </div>
              ) : null}

              {groupDetailsLoading ? (
                <div className="flex items-center justify-center py-10 text-[#1e3c73] dark:text-zinc-100">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : groupDetailsError ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {groupDetailsError}
                </div>
              ) : groupDetails.length === 0 ? (
                <div className="py-6 text-sm text-muted-foreground">
                  No applicants found for this special group in the selected period.
                </div>
              ) : (
                <div className="max-h-80 overflow-auto rounded-lg border border-sidebar-border/60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[15%] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Rank
                        </TableHead>
                        <TableHead className="w-[25%] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Tracking No.
                        </TableHead>
                        <TableHead className="w-[25%] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          LRN
                        </TableHead>
                        <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Applicant name
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupDetails.map((detail, index) => (
                        <TableRow key={`${detail.tracking_no}-${index}`}>
                          <TableCell className="font-semibold text-[#1e3c73] dark:text-zinc-100">
                            {detail.rank.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-[#1e3c73] dark:text-zinc-100">
                            {detail.tracking_no.trim() ? detail.tracking_no : '—'}
                          </TableCell>
                          <TableCell className="text-[#1e3c73] dark:text-zinc-100">
                            {detail.lrn.trim() ? detail.lrn : '—'}
                          </TableCell>
                          <TableCell className="text-[#1e3c73] dark:text-zinc-100">
                            {detail.name.trim() ? detail.name : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <div className="w-full flex flex-col   gap-1">
            <div className="inline-flex  gap-2">
              <span className="text-base font-semibold text-[#1e3c73] dark:text-zinc-100">
                {selectedAcademicYear ? `AY ${selectedAcademicYear}` : loadingDeadlines ? 'Loading…' : 'No academic year selected'}
              </span>

            </div>

            <span className="text-xs text-muted-foreground">
              {selectedDeadline?.deadline_formatted
                ? `Deadline: ${selectedDeadline.deadline_formatted}`
                : selectedDeadline?.deadline
                  ? `Deadline: ${selectedDeadline.deadline}`
                  : 'No deadline date selected'}
            </span>
          </div>
        </div>

        {(deadlinesError || summaryError) && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {deadlinesError ?? summaryError}
          </div>
        )}

     <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 auto-rows-min">
  <Card className="rounded-md border border-sidebar-border/70 shadow-none">
    <CardContent className="p-2 sm:p-2.5">
      <div className="min-w-0 flex items-start sm:items-center justify-between gap-2 leading-none">
        <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground whitespace-normal sm:whitespace-nowrap">
          Total number of applicants
        </span>
        <span className="text-xl sm:text-2xl font-bold text-[#1e3c73] shrink-0">
          {summaryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : summary.totals.applicants.toLocaleString()}
        </span>
      </div>
    </CardContent>
  </Card>

  <Card className="rounded-md border border-sidebar-border/70 shadow-none">
    <CardContent className="p-2 sm:p-2.5">
      <div className="min-w-0 flex items-start sm:items-center justify-between gap-2 leading-none">
        <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground whitespace-normal sm:whitespace-nowrap">
          Total number of qualified applicants
        </span>
        <span className="text-xl sm:text-2xl font-bold text-[#1e3c73] shrink-0">
          {summaryLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : summary.totals.qualified_applicants.toLocaleString()}
        </span>
      </div>
    </CardContent>
  </Card>

  <Card className="rounded-md border border-sidebar-border/70 shadow-none">
    <CardContent className="p-2 sm:p-2.5">
      <form className="space-y-2" onSubmit={handleNewSlotsSubmit}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 leading-none">
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            New slots
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-24 sm:w-28">
              <Input
                value={newSlots}
                onChange={(e) => setNewSlots(e.target.value.replace(/[^0-9]/g, ''))}
                inputMode="numeric"
                placeholder="0"
                className="h-8 pr-10 rounded-sm text-sm"
                disabled={savingNewSlots || !selectedDeadline}
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] sm:text-[11px] text-muted-foreground">
                slots
              </span>
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={savingNewSlots || !selectedDeadline || slotMatchesSaved}
              className="h-8 px-3 focus:outline-none focus:ring-1 focus:ring-[#1e3c73] bg-[#1e3c73] hover:bg-[#1a3565] text-white"
            >
              {savingNewSlots ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Save'}
            </Button>
          </div>
        </div>

        {selectedDeadline ? (
          <p className="text-[11px] text-muted-foreground">
            {slotMatchesSaved
              ? selectedDeadline.new_slots > 0
                ? `Currently allocated: ${selectedDeadline.new_slots.toLocaleString()} slot${selectedDeadline.new_slots === 1 ? '' : 's'}.`
                : 'No new slots recorded yet for this academic year.'
              : `${formattedNewSlots.toLocaleString()} new slot${formattedNewSlots === 1 ? '' : 's'} ready to save.`}
          </p>
        ) : (
          <p className="text-[11px] text-muted-foreground">Select an academic year to add new slots.</p>
        )}
      </form>
    </CardContent>
  </Card>
</section>


        <section className="space-y-4">
          <Card className="rounded-xl border border-sidebar-border/70 shadow-sm dark:border-sidebar-border">
            <CardHeader className="space-y-1 border-b border-sidebar-border/60 pb-4 dark:border-sidebar-border">
              <CardTitle className="text-lg font-semibold text-[#1e3c73]">
                CHED Merit Scholarship Program {selectedAcademicYear ? `(${selectedAcademicYear})` : ''}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Special group distribution with corresponding rank placements.
              </p>
            </CardHeader>
            <CardContent className="px-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Special Group
                    </TableHead>
                    <TableHead className="w-[20%] text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      No. of Applicants
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Ranks
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.special_groups.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                        {summaryLoading ? 'Loading special groups…' : 'No special group data found for the selected period.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    summary.special_groups.map((group) => (
                      <TableRow
                        key={group.name}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleGroupRowClick(group.name)}
                        onKeyDown={(event: KeyboardEvent<HTMLTableRowElement>) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            handleGroupRowClick(group.name);
                          }
                        }}
                        className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3c73]"
                      >
                        <TableCell className="font-medium text-[#1e3c73] dark:text-zinc-100">
                          {group.name}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-[#1e3c73] dark:text-zinc-100">
                          {group.count.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-[#1e3c73] dark:text-zinc-100">
                          {group.ranks.length ? (
                            <div className="flex flex-wrap gap-1.5">
                              {group.ranks.map((rank) => (
                                <span
                                  key={rank}
                                  className="inline-flex items-center rounded-full border border-[#1e3c73]/40 px-2 py-0.5 text-xs font-semibold text-[#1e3c73] dark:border-[#1e3c73]/60 dark:text-zinc-100"
                                >
                                  #{rank.toLocaleString()}
                                </span>
                              ))}
                            </div>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-sidebar-border/70 shadow-sm dark:border-sidebar-border">
            <CardHeader className="space-y-1 border-b border-sidebar-border/60 pb-4 dark:border-sidebar-border">
              <CardTitle className="text-lg font-semibold text-[#1e3c73]">
                Rank distribution {selectedAcademicYear ? `(${selectedAcademicYear})` : ''}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Number of applicants per rank based on computed points. Ties share the same rank.
              </p>
            </CardHeader>
            <CardContent>
              {summary.rank_counts.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {summaryLoading ? 'Loading rank distribution…' : 'No ranking data found for the selected period.'}
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-3">
                  {rankColumns.map((column, columnIndex) => (
                    <div
                      key={columnIndex}
                      className="rounded-xl border border-sidebar-border/60 bg-zinc-50 p-4 dark:border-sidebar-border dark:bg-zinc-900"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        <span>Rank</span>
                        <span>No. of Applicants</span>
                      </div>
                      <div className="mt-3 space-y-2">
                        {column.map((item) => (
                          <div
                            key={item.rank}
                            className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm font-medium text-[#1e3c73] shadow-sm dark:bg-zinc-950 dark:text-zinc-100"
                          >
                            <span className="font-semibold">{item.rank.toLocaleString()}</span>
                            <span>{item.count.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-6 rounded-xl border border-sidebar-border/60 bg-[#1e3c73]/5 px-4 py-3 text-sm font-semibold text-[#1e3c73] dark:border-sidebar-border dark:bg-[#1e3c73]/20 dark:text-zinc-100">
                Total applicants in distribution: {totalRankedApplicants.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
        </section>
      </div>
    </AppLayout>
  );
}

// resources/js/components/StatusCard.tsx
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, School, BookOpen, MapPin } from 'lucide-react';

export type TrackData = {
  tracking_no: string;
  submitted_at: string | null;
  incoming: boolean;
  applicant: {
    name: string | null;
    birthdate: string | null;
    sex: string;
    ethnicity?: string | null;
    religion?: string | null;
  };
  academic: {
    academic_year: string | null;
    deadline: string | null;
    school: { name: string | null; type: string | null };
    course: string | null;
    year_level: string | null;
    gad_stufaps_course?: string | null;
    gwa?: { g12_s1?: number; g12_s2?: number };
  };
  address: {
    scope: string;
    province?: string | null;
    municipality?: string | null;
    barangay?: string | null;
    purok_street?: string | null;
    zip_code?: string | null;
    district?: string | null;
  };
  files: Record<string, boolean>;
};

function LabeledRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value?: React.ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="mt-[2px] h-4 w-4 text-zinc-500" />
      <div className="text-zinc-600 dark:text-zinc-300">
        <span className="font-medium text-zinc-700 dark:text-zinc-200">{label}: </span>
        <span>{value}</span>
      </div>
    </div>
  );
}

function BoolDot({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${
        ok ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-700'
      }`}
    />
  );
}

export default function StatusCard({ data }: { data: TrackData }) {
  const addr = data.address;
  const addressLine = [
    addr.province,
    addr.municipality,
    addr.barangay,
    addr.purok_street,
    addr.zip_code,
  ]
    .filter(Boolean)
    .join(', ');

  const submitted = data.submitted_at
    ? new Date(data.submitted_at).toLocaleString()
    : '—';

  const fileEntries = Object.entries(data.files as Record<string, boolean>);

  return (
    <Card className="border border-zinc-200/80 dark:border-zinc-800 rounded-xl">
      <CardContent className="p-4 sm:p-5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {data.applicant.name || 'Applicant'}
              </span>
              {data.incoming && (
                <Badge
                  variant="outline"
                  className="rounded-full border-blue-200 text-blue-700 dark:border-blue-800 dark:text-blue-300"
                >
                  Incoming
                </Badge>
              )}
            </div>
            <div className="text-xs text-zinc-500">
              Tracking: <span className="font-mono">{data.tracking_no}</span>
            </div>
          </div>

          <div className="text-xs text-zinc-500">Submitted: {submitted}</div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <LabeledRow
              icon={Calendar}
              label="Academic Year"
              value={`${data.academic.academic_year || '—'} (Deadline: ${
                data.academic.deadline || '—'
              })`}
            />
            <LabeledRow
              icon={School}
              label="Intended School"
              value={
                <>
                  {data.academic.school?.name || '—'}{' '}
                  {data.academic.school?.type ? (
                    <span className="text-xs text-zinc-500">
                      ({data.academic.school?.type})
                    </span>
                  ) : null}
                </>
              }
            />
            <LabeledRow
              icon={BookOpen}
              label="Course / Year"
              value={`${data.academic.course || '—'}${
                data.academic.year_level ? ` — ${data.academic.year_level}` : ''
              }`}
            />
          </div>

          <div className="space-y-2">
            <LabeledRow
              icon={MapPin}
              label={`${addr.scope} Address`}
              value={addressLine || '—'}
            />
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span>Files:</span>
              {fileEntries.map(([k, ok]) => (
                <span key={k} className="inline-flex items-center gap-1">
                  <BoolDot ok={Boolean(ok)} /> {k.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

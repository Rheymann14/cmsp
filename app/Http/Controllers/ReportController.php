<?php

namespace App\Http\Controllers;

use App\Models\CmspApplication;
use App\Services\CmspRankingService;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Inertia\Inertia;

class ReportController extends Controller
{
    private const SPECIAL_GROUP_LABELS = [
        'Person With Disability (PWD)',
        'Solo Parent',
        'Dependent Solo Parent',
        'Underprivileged and Homeless Citizens',
        'Magna Carta for the Poor',
        'First Generation Students (first in the family to attend college or university)',
        'Student Senior Citizen',
        'Indigenous People (IP)',
    ];

    public function index()
    {
        return Inertia::render('report');
    }

    public function summary(Request $request, CmspRankingService $rankingService)
    {
        $academicYear  = trim((string) $request->get('academic_year', ''));
        $deadlineInput = trim((string) $request->get('deadline', ''));
        $deadlineDate  = (preg_match('/^\d{4}-\d{2}-\d{2}$/', $deadlineInput)) ? $deadlineInput : null;

        try {
            $data = $this->loadApplicationsAndRanks($academicYear, $deadlineDate, $rankingService);

            /** @var Collection<int, CmspApplication> $applications */
            $applications = $data['applications'];
            /** @var Collection<int, array{application:CmspApplication,rank:int}> $ranked */
            $ranked = $data['ranked'];

            $totalApplicants     = $applications->count();
            $qualifiedApplicants = $applications
                ->filter(function (CmspApplication $application) {
                    $remarks = optional($application->latestValidation)->remarks ?? '';
                    return strcasecmp($remarks, 'QUALIFIED APPLICANT') === 0;
                })
                ->count();

            $rankCounts          = $this->buildRankCounts($ranked);          // uses normalized shape
            $specialGroupSummary = $this->buildSpecialGroupSummary($ranked); // uses normalized shape

            return response()->json([
                'totals' => [
                    'applicants'            => $totalApplicants,
                    'qualified_applicants'  => $qualifiedApplicants,
                ],
                'rank_counts'   => $rankCounts,
                'special_groups'=> $specialGroupSummary,
            ]);
        } catch (\Throwable $e) {
            report($e);

            // Optional: return more detail only in local/dev
            if (app()->hasDebugModeEnabled() || app()->environment('local')) {
                return response()->json([
                    'message' => 'Server error while loading report summary.',
                    'error'   => class_basename($e) . ': ' . $e->getMessage(),
                ], 500);
            }

            return response()->json([
                'message' => 'Server error while loading report summary.',
            ], 500);
        }
    }

    public function specialGroupDetails(Request $request, CmspRankingService $rankingService)
    {
        $academicYear  = trim((string) $request->get('academic_year', ''));
        $deadlineInput = trim((string) $request->get('deadline', ''));
        $deadlineDate  = (preg_match('/^\d{4}-\d{2}-\d{2}$/', $deadlineInput)) ? $deadlineInput : null;

        $groupInput = $this->normalizeGroupLabel((string) $request->get('group', ''));
        $rankInput  = $request->get('rank');

        $rank = null;
        if ($rankInput !== null && $rankInput !== '') {
            if (!is_numeric($rankInput)) {
                return response()->json([
                    'message' => 'A valid rank is required.',
                ], 422);
            }

            $rank = (int) $rankInput;
            if ($rank <= 0) {
                return response()->json([
                    'message' => 'A valid rank is required.',
                ], 422);
            }
        }

        if ($groupInput === '') {
            return response()->json([
                'message' => 'A valid special group is required.',
            ], 422);
        }

        $groupLabel = $this->canonicalizeGroupLabel($groupInput);

        try {
            $data = $this->loadApplicationsAndRanks($academicYear, $deadlineDate, $rankingService);

            /** @var Collection<int, array{application:CmspApplication,rank:int}> $ranked */
            $ranked = $data['ranked'];

            $applicants = $ranked
                ->filter(function (array $entry) use ($groupLabel, $rank) {
                    /** @var CmspApplication $application */
                    $application = $entry['application'];

                    if ($rank !== null && (int) $entry['rank'] !== $rank) {
                        return false;
                    }

                    $groups = $this->extractGroups($application->special_groups);

                    foreach ($groups as $group) {
                        $canonical = $this->canonicalizeGroupLabel((string) $group);
                        if ($canonical !== '' && $canonical === $groupLabel) {
                            return true;
                        }
                    }

                    return false;
                })
                ->map(function (array $entry) {
                    /** @var CmspApplication $application */
                    $application = $entry['application'];

                    return [
                        'tracking_no' => (string) ($application->tracking_no ?? ''),
                        'lrn'         => (string) ($application->lrn ?? ''),
                        'name'        => $this->formatApplicantName($application),
                        'rank'        => (int) $entry['rank'],
                    ];
                })
                ->values()
                ->all();

            $ranks = collect($applicants)
                ->pluck('rank')
                ->filter(fn ($value) => is_numeric($value) && (int) $value > 0)
                ->map(fn ($value) => (int) $value)
                ->unique()
                ->sort()
                ->values()
                ->all();

            return response()->json([
                'group'      => $groupLabel,
                'rank'       => $rank,
                'ranks'      => $ranks,
                'applicants' => $applicants,
            ]);
        } catch (\Throwable $e) {
            report($e);

            if (app()->hasDebugModeEnabled() || app()->environment('local')) {
                return response()->json([
                    'message' => 'Server error while loading rank details.',
                    'error'   => class_basename($e) . ': ' . $e->getMessage(),
                ], 500);
            }

            return response()->json([
                'message' => 'Server error while loading rank details.',
            ], 500);
        }
    }

    /**
     * Force any compute() output into a consistent shape:
     *  [
     *    ['application' => CmspApplication, 'rank' => int],
     *    ...
     *  ]
     */
    private function normalizeRanked(Collection $items): Collection
    {
        return $items
            ->map(function ($row) {
                $app  = null;
                $rank = null;

                // Array-like
                if (is_array($row)) {
                    $app  = $row['application'] ?? $row['app'] ?? null;
                    $rank = $row['rank'] ?? $row['position'] ?? null;
                }
                // Object-like
                elseif (is_object($row)) {
                    // If the row itself is the application and rank is a property
                    if ($row instanceof CmspApplication) {
                        $app  = $row;
                        // Support $row->rank if service set it
                        $rank = $row->rank ?? (method_exists($row, 'getAttribute') ? $row->getAttribute('rank') : null);
                    } else {
                        // Try common property names
                        $app  = $row->application ?? $row->app ?? null;
                        $rank = $row->rank ?? (method_exists($row, 'getAttribute') ? $row->getAttribute('rank') : null);
                    }
                }

                // Coerce/validate
                $rank = is_numeric($rank) ? (int) $rank : null;

                return [
                    'application' => $app instanceof CmspApplication ? $app : null,
                    'rank'        => $rank,
                ];
            })
            // Keep only valid rows
            ->filter(fn ($r) => $r['application'] instanceof CmspApplication && is_int($r['rank']))
            ->values();
    }

    /**
     * @return array{
     *     applications: Collection<int, CmspApplication>,
     *     ranked: Collection<int, array{application:CmspApplication,rank:int}>
     * }
     */
    private function loadApplicationsAndRanks(string $academicYear, ?string $deadlineDate, CmspRankingService $rankingService): array
    {
        $applicationsQuery = CmspApplication::query()->with('latestValidation');

        if ($academicYear !== '') {
            $applicationsQuery->where('academic_year', $academicYear);
        }

        if ($deadlineDate !== null) {
            $applicationsQuery->whereDate('deadline', '=', $deadlineDate);
        }

        $applications = $applicationsQuery->get();

        $rawRanked = rescue(
            fn () => $rankingService->compute($applications),
            rescue: collect(),
            report: true
        );

        $ranked = $this->normalizeRanked(collect($rawRanked));

        return [
            'applications' => $applications,
            'ranked'       => $ranked,
        ];
    }

    /**
     * @param  Collection<int, array{rank:int}>  $ranked  (normalized)
     * @return array<int, array{rank:int,count:int}>
     */
    private function buildRankCounts(Collection $ranked): array
    {
        $counts = [];
        foreach ($ranked as $entry) {
            $rank = (int) $entry['rank'];
            $counts[$rank] = ($counts[$rank] ?? 0) + 1;
        }
        ksort($counts);

        return collect($counts)
            ->map(fn ($count, $rank) => ['rank' => (int) $rank, 'count' => (int) $count])
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, array{application:CmspApplication,rank:int}>  $ranked  (normalized)
     * @return array<int, array{name:string,count:int,ranks:array<int,int>}>
     */
    private function buildSpecialGroupSummary(Collection $ranked): array
    {
        $summary = [];

        foreach ($ranked as $entry) {
            /** @var CmspApplication $application */
            $application = $entry['application'];
            $rank        = (int) $entry['rank'];

            // Be flexible: array JSON, CSV string, null
            $specialGroups = $this->extractGroups($application->special_groups);

            foreach ($specialGroups as $group) {
                $label = $this->normalizeGroupLabel((string) $group);
                if ($label === '' || strcasecmp($label, 'N/A') === 0) {
                    continue;
                }

                $label = $this->canonicalizeGroupLabel($label);

                $summary[$label] ??= ['name' => $label, 'count' => 0, 'ranks' => []];
                $summary[$label]['count']++;
                $summary[$label]['ranks'][] = $rank;
            }
        }

        $normalizedSummary = collect($summary)
            ->map(function ($item) {
                $r = $item['ranks'];
                sort($r, SORT_NUMERIC);
                $item['ranks'] = array_values(array_unique($r));
                return $item;
            });

        $ordered = collect(self::SPECIAL_GROUP_LABELS)
            ->map(function (string $label) use ($normalizedSummary) {
                $entry = $normalizedSummary->get($label);

                if ($entry === null) {
                    return ['name' => $label, 'count' => 0, 'ranks' => []];
                }

                return $entry;
            })
            ->values()
            ->all();

        $remaining = $normalizedSummary
            ->filter(fn ($_, $label) => !in_array($label, self::SPECIAL_GROUP_LABELS, true))
            ->sortBy('name')
            ->values()
            ->all();

        return array_merge($ordered, $remaining);
    }

    private function normalizeNamePart(?string $value): string
    {
        if ($value === null) {
            return '';
        }

        $normalized = preg_replace('/\s+/u', ' ', trim($value));

        return $normalized === null ? '' : $normalized;
    }

    private function formatApplicantName(CmspApplication $application): string
    {
        $last      = $this->normalizeNamePart($application->last_name ?? null);
        $extension = $this->normalizeNamePart($application->name_extension ?? null);
        $first     = $this->normalizeNamePart($application->first_name ?? null);
        $middle    = $this->normalizeNamePart($application->middle_name ?? null);

        $segments = [];

        if ($last !== '') {
            $surname = $last;
            if ($extension !== '') {
                $surname = trim($surname . ' ' . $extension);
            }
            $segments[] = $surname;
        }

        $givenParts = array_filter([$first, $middle], fn ($part) => $part !== '');
        if (!empty($givenParts)) {
            $given = implode(' ', $givenParts);
            if (!empty($segments)) {
                $segments[0] .= ', ' . $given;
            } else {
                $segments[] = $given;
            }
        }

        if (empty($segments)) {
            return '—';
        }

        return $segments[0];
    }

    /**
     * Accepts array, JSON-cast array, CSV string, or null.
     */
    private function extractGroups($value): array
    {
        if (is_array($value)) {
            return $value;
        }
        if (is_string($value)) {
            // Try CSV splitting, ignore empties
            return array_values(array_filter(array_map('trim', preg_split('/\s*,\s*/', $value) ?: []), fn ($v) => $v !== ''));
        }
        return []; // null/others
    }

    private function normalizeGroupLabel(string $label): string
    {
        $normalized = preg_replace('/\s+/u', ' ', trim($label));

        return $normalized === null ? '' : $normalized;
    }

    private function canonicalizeGroupLabel(string $label): string
    {
        $normalized = $this->normalizeGroupLabel($label);
        $lowercase  = mb_strtolower($normalized);

        foreach (self::SPECIAL_GROUP_LABELS as $option) {
            if (mb_strtolower($option) === $lowercase) {
                return $option;
            }
        }

        return $normalized;
    }
}

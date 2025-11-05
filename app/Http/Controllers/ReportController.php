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
            $applicationsQuery = CmspApplication::query()->with('latestValidation');

            if ($academicYear !== '') {
                $applicationsQuery->where('academic_year', $academicYear);
            }

            if ($deadlineDate !== null) {
                // Your schema shows a DATE column named `deadline`
                $applicationsQuery->whereDate('deadline', '=', $deadlineDate);
            }

            $applications = $applicationsQuery->get();

            // 1) Compute ranks (rescue to avoid hard 500s)
         $rawRanked = rescue(
                fn () => $rankingService->compute($applications),
                rescue: collect(),
                report: true
            );

            // 2) **Normalize** to ['application' => CmspApplication, 'rank' => int]
            $ranked = $this->normalizeRanked(collect($rawRanked));

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
                $label = trim((string) $group);
                if ($label === '' || strcasecmp($label, 'N/A') === 0) {
                    continue;
                }

                $summary[$label] ??= ['name' => $label, 'count' => 0, 'ranks' => []];
                $summary[$label]['count']++;
                $summary[$label]['ranks'][] = $rank;
            }
        }

        return collect($summary)
            ->map(function ($item) {
                $r = $item['ranks'];
                sort($r, SORT_NUMERIC);
                $item['ranks'] = array_values(array_unique($r));
                return $item;
            })
            ->sortBy('name')
            ->values()
            ->all();
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
}

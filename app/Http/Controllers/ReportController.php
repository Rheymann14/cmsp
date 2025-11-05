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
        $academicYear = trim((string) $request->get('academic_year', ''));
        $deadlineInput = trim((string) $request->get('deadline', ''));
        $deadlineDate = null;

        if ($deadlineInput !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $deadlineInput)) {
            $deadlineDate = $deadlineInput;
        }

        $applicationsQuery = CmspApplication::query()
            ->with(['latestValidation' => function ($query) {
                $query->select('id', 'cmsp_id', 'remarks');
            }]);

        if ($academicYear !== '') {
            $applicationsQuery->where('academic_year', $academicYear);
        }

        if ($deadlineDate !== null) {
            $applicationsQuery->whereDate('deadline', $deadlineDate);
        }

        $applications = $applicationsQuery->get();
        $ranked = $rankingService->compute($applications);

        $totalApplicants = $applications->count();
        $qualifiedApplicants = $applications
            ->filter(function (CmspApplication $application) {
                $remarks = optional($application->latestValidation)->remarks;
                return $remarks !== null && strcasecmp($remarks, 'QUALIFIED APPLICANT') === 0;
            })
            ->count();

        $rankCounts = $this->buildRankCounts($ranked);
        $specialGroupSummary = $this->buildSpecialGroupSummary($ranked);

        return response()->json([
            'totals' => [
                'applicants' => $totalApplicants,
                'qualified_applicants' => $qualifiedApplicants,
            ],
            'rank_counts' => $rankCounts,
            'special_groups' => $specialGroupSummary,
        ]);
    }

    /**
     * @param  Collection<int, array{rank:int}>  $ranked
     * @return array<int, array{rank:int,count:int}>
     */
    private function buildRankCounts(Collection $ranked): array
    {
        $counts = [];

        foreach ($ranked as $entry) {
            $rank = $entry['rank'];
            if (!isset($counts[$rank])) {
                $counts[$rank] = 0;
            }
            $counts[$rank]++;
        }

        ksort($counts);

        return collect($counts)
            ->map(fn ($count, $rank) => ['rank' => (int) $rank, 'count' => (int) $count])
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, array{application:CmspApplication,rank:int}>  $ranked
     * @return array<int, array{name:string,count:int,ranks:array<int,int>}>
     */
    private function buildSpecialGroupSummary(Collection $ranked): array
    {
        $summary = [];

        foreach ($ranked as $entry) {
            /** @var CmspApplication $application */
            $application = $entry['application'];
            $rank = (int) $entry['rank'];
            $specialGroups = Arr::wrap($application->special_groups);

            foreach ($specialGroups as $group) {
                $label = trim((string) $group);
                if ($label === '' || strcasecmp($label, 'N/A') === 0) {
                    continue;
                }

                if (!array_key_exists($label, $summary)) {
                    $summary[$label] = [
                        'name' => $label,
                        'count' => 0,
                        'ranks' => [],
                    ];
                }

                $summary[$label]['count']++;
                $summary[$label]['ranks'][] = $rank;
            }
        }

        return collect($summary)
            ->map(function ($item) {
                $ranks = $item['ranks'];
                sort($ranks, SORT_NUMERIC);
                $item['ranks'] = array_values(array_unique($ranks));
                return $item;
            })
            ->sortBy('name')
            ->values()
            ->all();
    }
}

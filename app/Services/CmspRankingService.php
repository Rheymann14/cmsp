<?php

namespace App\Services;

use App\Models\CmspApplication;
use Illuminate\Support\Collection;

class CmspRankingService
{
    /**
     * Compute weighted points and ranking information for CMSP applications.
     *
     * @param  Collection<int, CmspApplication>  $applications
     * @return Collection<int, array{
     *     application: CmspApplication,
     *     gwa: float,
     *     income_total: float,
     *     grade_points: int,
     *     income_points: int,
     *     grade_weighted: float,
     *     income_weighted: float,
     *     total_points: float,
     *     plus_five: int,
     *     final_points: float,
     *     rank: int,
     * }>
     */
    public function compute(Collection $applications): Collection
    {
        $computed = $applications->map(function (CmspApplication $application) {
            $gwa = (float) ($application->gwa_g12_s2 ?? 0);
            $gradePoints = $this->mapGradePoints($gwa);
            $incomeTotal = $this->resolveHouseholdIncome($application);
            $incomePoints = $this->mapIncomePoints($incomeTotal);
            $gradeWeighted = round($gradePoints * 0.70, 2);
            $incomeWeighted = round($incomePoints * 0.30, 2);
            $totalPoints = round($gradeWeighted + $incomeWeighted, 2);
            $plusFive = $application->proof_of_special_group_path ? 5 : 0;
            $finalPoints = round($totalPoints + $plusFive, 2);

            return [
                'application' => $application,
                'gwa' => $gwa,
                'income_total' => $incomeTotal,
                'grade_points' => $gradePoints,
                'income_points' => $incomePoints,
                'grade_weighted' => $gradeWeighted,
                'income_weighted' => $incomeWeighted,
                'total_points' => $totalPoints,
                'plus_five' => $plusFive,
                'final_points' => $finalPoints,
            ];
        })->values();

        $sorted = $computed->sort(function (array $a, array $b) {
            if ($a['final_points'] === $b['final_points']) {
                if ($a['total_points'] === $b['total_points']) {
                    if ($a['grade_points'] === $b['grade_points']) {
                        return $a['application']->id <=> $b['application']->id;
                    }

                    return $b['grade_points'] <=> $a['grade_points'];
                }

                return $b['total_points'] <=> $a['total_points'];
            }

            return $b['final_points'] <=> $a['final_points'];
        })->values();

        $ranked = [];
        $currentRank = 0;
        $position = 0;
        $previousFinal = null;

        foreach ($sorted as $entry) {
            $position++;
            if ($previousFinal !== null && $entry['final_points'] === $previousFinal) {
                $rank = $currentRank;
            } else {
                $rank = $position;
                $currentRank = $rank;
                $previousFinal = $entry['final_points'];
            }

            $entry['rank'] = $rank;
            $ranked[] = $entry;
        }

        return collect($ranked);
    }

    private function mapGradePoints(float $grade): int
    {
        if ($grade >= 99) {
            return 100;
        }
        if ($grade >= 97) {
            return 95;
        }
        if ($grade >= 95) {
            return 90;
        }
        if ($grade >= 93) {
            return 85;
        }
        if ($grade >= 91) {
            return 80;
        }

        return 75;
    }

    private function mapIncomePoints(float $income): int
    {
        if ($income <= 100000) {
            return 100;
        }
        if ($income <= 200000) {
            return 85;
        }
        if ($income <= 300000) {
            return 70;
        }
        if ($income <= 400000) {
            return 55;
        }
        if ($income <= 500000) {
            return 40;
        }

        return 0;
    }

    private function resolveHouseholdIncome(CmspApplication $application): float
    {
        $father = (float) ($application->father_income_yearly_bracket ?? 0);
        $mother = (float) ($application->mother_income_yearly_bracket ?? 0);

        $total = $father + $mother;
        if ($total > 0) {
            return $total;
        }

        $guardianMonthly = (float) ($application->guardian_income_monthly ?? 0);
        if ($guardianMonthly > 0) {
            return $guardianMonthly * 12;
        }

        return 0;
    }
}

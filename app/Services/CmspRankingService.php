<?php

namespace App\Services;

use App\Models\CmspApplication;
use Illuminate\Support\Collection;

class CmspRankingService
{
    public function __construct(private readonly CmspEvaluationService $evaluationService)
    {
    }

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
            $scores = $this->evaluationService->computeScores($application);

            return [
                'application' => $application,
            ] + $scores;
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
        $lastScore = null;

        foreach ($sorted as $entry) {
            $score = $entry['final_points'] ?? null;
            $formattedScore = $score === null ? null : sprintf('%.2f', (float) $score);

            if ($formattedScore !== null && $formattedScore === $lastScore) {
                $entry['rank'] = $currentRank;
            } else {
                $currentRank++;
                $entry['rank'] = $currentRank;
                $lastScore = $formattedScore;
            }

            $ranked[] = $entry;
        }

        return collect($ranked);
    }
}

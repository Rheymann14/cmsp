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
     *     grade_points: float,
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
                $siblingComparison = $this->hasSiblingTieBreaker($b['application']) <=> $this->hasSiblingTieBreaker($a['application']);
                if ($siblingComparison !== 0) {
                    return $siblingComparison;
                }

                $medicalComparison = $this->hasMedicalIssueTieBreaker($b['application']) <=> $this->hasMedicalIssueTieBreaker($a['application']);
                if ($medicalComparison !== 0) {
                    return $medicalComparison;
                }

                return $a['application']->id <=> $b['application']->id;
            }

            return $b['final_points'] <=> $a['final_points'];
        })->values();

        $ranked = [];
        $currentRank = 0;
        $lastScore = null;

        foreach ($sorted as $entry) {
            $score = $entry['final_points'] ?? null;
            $formattedScore = $score === null
                ? null
                : implode('|', [
                    sprintf('%.2f', (float) $score),
                    $this->hasSiblingTieBreaker($entry['application']) ? 'siblings' : 'no-siblings',
                    $this->hasMedicalIssueTieBreaker($entry['application']) ? 'medical' : 'no-medical',
                ]);

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

    private function hasSiblingTieBreaker(CmspApplication $application): bool
    {
        return (int) ($application->latestValidation?->no_siblings ?? 0) >= 2;
    }

    private function hasMedicalIssueTieBreaker(CmspApplication $application): bool
    {
        return (bool) ($application->latestValidation?->has_medical_issue_proof ?? false);
    }
}

<?php

use App\Models\CmspApplication;
use App\Services\CmspRankingService;

it('assigns dense ranks when applicants tie on final points', function () {
    $service = new CmspRankingService();

    $makeApplication = function (int $id, float $gwa, float $fatherIncome, float $motherIncome, bool $withProof = false) {
        $application = new CmspApplication();

        $application->forceFill([
            'id' => $id,
            'gwa_g12_s2' => $gwa,
            'father_income_yearly_bracket' => $fatherIncome,
            'mother_income_yearly_bracket' => $motherIncome,
            'guardian_income_monthly' => 0,
            'proof_of_special_group_path' => $withProof ? 'proof.pdf' : null,
        ]);

        return $application;
    };

    $applications = collect([
        // Final points: 100.00 (tie for first)
        $makeApplication(1, 99, 50_000, 10_000),
        $makeApplication(2, 99, 40_000, 20_000),
        // Final points: 97.00 (with +5 bonus)
        $makeApplication(3, 97, 150_000, 0, true),
        // Final points: 80.50
        $makeApplication(4, 93, 250_000, 0),
    ]);

    $results = $service->compute($applications);

    expect($results->pluck('final_points')->all())->toBe([100.0, 100.0, 97.0, 80.5]);
    expect($results->pluck('rank')->all())->toBe([1, 1, 2, 3]);
});

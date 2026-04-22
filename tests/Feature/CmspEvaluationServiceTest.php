<?php

use App\Models\CmspApplication;
use App\Models\Course;
use App\Services\CmspEvaluationService;
use App\Services\CmspRankingService;
use Database\Seeders\ReferencePointSeeder;
use Illuminate\Support\Collection;

beforeEach(function () {
    $this->seed(ReferencePointSeeder::class);
});

function cmspTestApplication(array $overrides = []): CmspApplication
{
    return new CmspApplication(array_merge([
        'gwa_g12_s1' => 95,
        'gwa_g12_s2' => 95,
        'father_income_yearly_bracket' => 100000,
        'mother_income_yearly_bracket' => 0,
        'guardian_income_monthly' => 0,
        'special_groups' => ['N/A'],
        'application_form_path' => 'attachments/application.pdf',
        'grades_g12_s1_path' => 'attachments/s1.pdf',
        'grades_g12_s2_path' => 'attachments/s2.pdf',
        'birth_certificate_path' => 'attachments/birth.pdf',
        'proof_of_income_path' => 'attachments/income.pdf',
        'proof_of_special_group_path' => null,
        'course_name' => 'Bachelor of Science in Information Technology',
        'intended_school_name' => '',
    ], $overrides));
}

test('grade point mapping follows the Excel REF boundary values', function (float $grade, int $expectedPoints) {
    $service = app(CmspEvaluationService::class);

    expect($service->mapGradePoints($grade))->toBe($expectedPoints);
})->with([
    [90.49, 75],
    [91.00, 80],
    [92.49, 80],
    [93.00, 85],
    [94.49, 85],
    [95.00, 90],
    [96.49, 90],
    [97.00, 95],
    [98.49, 95],
    [99.00, 100],
    [100.00, 100],
]);

test('income point mapping follows the Excel REF boundary values', function (float $income, int $expectedPoints) {
    $service = app(CmspEvaluationService::class);

    expect($service->mapIncomePoints($income))->toBe($expectedPoints);
})->with([
    [100000, 100],
    [100001, 85],
    [200000, 85],
    [200001, 70],
    [300000, 70],
    [300001, 55],
    [400000, 55],
    [400001, 40],
    [500000, 40],
    [500001, 0],
]);

test('score calculation uses average Grade 12 GWA, Excel weights, plus five, and final total', function () {
    $service = app(CmspEvaluationService::class);
    $application = cmspTestApplication([
        'gwa_g12_s1' => 94,
        'gwa_g12_s2' => 96,
        'father_income_yearly_bracket' => 100001,
        'mother_income_yearly_bracket' => 99999,
        'special_groups' => ['Solo Parent'],
        'proof_of_special_group_path' => 'attachments/solo-parent.pdf',
    ]);

    $scores = $service->computeScores($application);

    expect($scores['grade_12_gwa'])->toBe(95.0)
        ->and($scores['income'])->toBe(200000.0)
        ->and($scores['equivalent_grade_points'])->toBe(90)
        ->and($scores['equivalent_income_points'])->toBe(85)
        ->and($scores['weighted_grade_points'])->toBe(63.0)
        ->and($scores['weighted_income_points'])->toBe(25.5)
        ->and($scores['total_points'])->toBe(88.5)
        ->and($scores['plus_five_points'])->toBe(5)
        ->and($scores['final_total_points'])->toBe(93.5);
});

test('valid special group gets plus five only when proof is attached and N/A gets zero', function () {
    $service = app(CmspEvaluationService::class);

    expect($service->computeScores(cmspTestApplication([
        'special_groups' => ['Solo Parent'],
        'proof_of_special_group_path' => 'attachments/solo.pdf',
    ]))['plus_five_points'])->toBe(5)
        ->and($service->computeScores(cmspTestApplication([
            'special_groups' => ['Solo Parent'],
            'proof_of_special_group_path' => null,
        ]))['plus_five_points'])->toBe(0)
        ->and($service->computeScores(cmspTestApplication([
            'special_groups' => ['N/A'],
            'proof_of_special_group_path' => null,
        ]))['plus_five_points'])->toBe(0);
});

test('qualification returns qualified when requirements, priority course, and active program pass', function () {
    Course::create(['name' => 'Bachelor of Science in Information Technology']);

    $result = app(CmspEvaluationService::class)->evaluate(cmspTestApplication(), [], [
        'is_priority' => true,
        'is_discontinued' => false,
    ]);

    expect($result['qualification_status'])->toBe('qualified')
        ->and($result['remarks'])->toBe(CmspEvaluationService::QUALIFIED_REMARK)
        ->and($result['remark_reasons'])->toBe([]);
});

test('qualification disqualifies non-priority and discontinued programs', function () {
    $service = app(CmspEvaluationService::class);

    $nonPriority = $service->evaluate(cmspTestApplication(), [], [
        'is_priority' => false,
        'is_discontinued' => false,
    ]);
    $discontinued = $service->evaluate(cmspTestApplication(), [], [
        'is_priority' => true,
        'is_discontinued' => true,
    ]);

    expect($nonPriority['remarks'])->toContain('NOT PRIORITY COURSE')
        ->and($discontinued['remarks'])->toContain('DISCONTINUED PROGRAM');
});

test('qualification combines automatic and manual disqualification reasons with commas', function () {
    $service = app(CmspEvaluationService::class);
    $application = cmspTestApplication([
        'proof_of_income_path' => null,
        'birth_certificate_path' => null,
        'father_income_yearly_bracket' => 500001,
    ]);

    $result = $service->evaluate($application, [
        'duplicate_entry',
        'other_scholarship',
        'outside_region_xii',
        'false_documents',
        'earned_units',
    ], [
        'is_priority' => false,
        'is_discontinued' => true,
    ]);

    expect($result['qualification_status'])->toBe('disqualified')
        ->and($result['remarks'])->toContain('Income exceeds 500,000.00')
        ->and($result['remarks'])->toContain('No Proof of Income')
        ->and($result['remarks'])->toContain('No Birth Certificate')
        ->and($result['remarks'])->toContain('NOT PRIORITY COURSE')
        ->and($result['remarks'])->toContain('DISCONTINUED PROGRAM')
        ->and($result['remarks'])->toContain('Double Entry')
        ->and($result['remarks'])->toContain('OTHER SCHOLARSHIP')
        ->and($result['remarks'])->toContain('Outside Region XII')
        ->and($result['remarks'])->toContain('FALSE DOCUMENTS')
        ->and($result['remarks'])->toContain('WITH EARNED UNITS')
        ->and($result['remarks'])->toContain(', ');
});

test('qualification catches no grades and incomplete grade attachments', function () {
    $result = app(CmspEvaluationService::class)->evaluate(cmspTestApplication([
        'gwa_g12_s1' => null,
        'grades_g12_s1_path' => null,
    ]), [], [
        'is_priority' => true,
        'is_discontinued' => false,
    ]);

    expect($result['remark_reasons'])->toContain('NO GR')
        ->and($result['remark_reasons'])->toContain('Lacking/Incomplete Grades');
});

test('ranking sorts by final total points descending and shares dense rank on ties', function () {
    $service = app(CmspRankingService::class);

    $first = cmspTestApplication(['gwa_g12_s1' => 99, 'gwa_g12_s2' => 99]);
    $first->id = 1;

    $tiedA = cmspTestApplication(['gwa_g12_s1' => 95, 'gwa_g12_s2' => 95]);
    $tiedA->id = 2;

    $tiedB = cmspTestApplication(['gwa_g12_s1' => 95, 'gwa_g12_s2' => 95]);
    $tiedB->id = 3;

    $ranked = $service->compute(new Collection([$tiedA, $first, $tiedB]))->values();

    expect($ranked[0]['application']->id)->toBe(1)
        ->and($ranked[0]['rank'])->toBe(1)
        ->and($ranked[1]['rank'])->toBe(2)
        ->and($ranked[2]['rank'])->toBe(2);
});

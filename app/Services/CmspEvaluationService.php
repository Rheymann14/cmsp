<?php

namespace App\Services;

use App\Models\CmspApplication;
use App\Models\Course;
use App\Models\ReferencePoint;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class CmspEvaluationService
{
    public const QUALIFIED_REMARK = 'QUALIFIED APPLICANT';
    public const QUALIFICATION_QUALIFIED = 'qualified';
    public const QUALIFICATION_DISQUALIFIED = 'disqualified';

    public const REASON_NOT_PRIORITY_COURSE = 'NOT PRIORITY COURSE';
    public const REASON_DISCONTINUED_PROGRAM = 'DISCONTINUED PROGRAM';
    public const REASON_INCOME_EXCEEDS = 'Income exceeds 500,000.00';
    public const REASON_NO_GRADES = 'NO GR';
    public const REASON_INCOMPLETE_GRADES = 'Lacking/Incomplete Grades';
    public const REASON_NO_DOCUMENTS = 'No Documents Submitted';
    public const REASON_NO_APPLICATION_FORM = 'No Application Form';
    public const REASON_NO_BIRTH_CERTIFICATE = 'No Birth Certificate';
    public const REASON_NO_PROOF_OF_INCOME = 'No Proof of Income';
    public const REASON_LACKING_SPECIAL_GROUP_PROOF = 'Lacking Special Group Proof';

    /**
     * Excel-style manual disqualifiers captured by the validator.
     *
     * @return array<string, string>
     */
    public static function manualDisqualificationReasons(): array
    {
        return [
            'duplicate_entry' => 'Double Entry',
            'other_scholarship' => 'OTHER SCHOLARSHIP',
            'no_proof_of_income' => self::REASON_NO_PROOF_OF_INCOME,
            'lacking_fathers_proof_of_income' => "LACKING FATHER'S PROOF OF INCOME",
            'lacking_mothers_proof_of_income' => "LACKING MOTHER'S PROOF OF INCOME",
            'no_copc' => 'No COPC',
            'no_grades' => self::REASON_NO_GRADES,
            'dnmgr' => 'DNMGR',
            'outside_region_xii' => 'Outside Region XII',
            'no_documents_submitted' => self::REASON_NO_DOCUMENTS,
            'no_birth_certificate' => self::REASON_NO_BIRTH_CERTIFICATE,
            'no_contract_ofw' => 'No Contract (OFW)',
            'incomplete_grades' => self::REASON_INCOMPLETE_GRADES,
            'outdated_itr' => 'OUTDATED ITR',
            'false_documents' => 'FALSE DOCUMENTS',
            'earned_units' => 'WITH EARNED UNITS',
        ];
    }

    /**
     * @return array{
     *     grade_12_gwa: float|null,
     *     income: float,
     *     equivalent_grade_points: int,
     *     equivalent_income_points: int,
     *     weighted_grade_points: float,
     *     weighted_income_points: float,
     *     total_points: float,
     *     plus_five_points: int,
     *     final_total_points: float,
     *     gwa: float|null,
     *     income_total: float,
     *     grade_points: int,
     *     income_points: int,
     *     grade_weighted: float,
     *     income_weighted: float,
     *     plus_five: int,
     *     final_points: float
     * }
     */
    public function computeScores(CmspApplication $application): array
    {
        $grade12Gwa = $this->resolveGrade12Gwa($application);
        $gradePoints = $grade12Gwa === null ? 0 : $this->mapGradePoints($grade12Gwa);
        $income = $this->resolveHouseholdIncome($application);
        $incomePoints = $this->mapIncomePoints($income);
        $weightedGrade = round($gradePoints * 0.70, 2);
        $weightedIncome = round($incomePoints * 0.30, 2);
        $total = round($weightedGrade + $weightedIncome, 2);
        $plusFive = $this->resolvePlusFivePoints($application);
        $finalTotal = round($total + $plusFive, 2);

        return [
            'grade_12_gwa' => $grade12Gwa,
            'income' => $income,
            'equivalent_grade_points' => $gradePoints,
            'equivalent_income_points' => $incomePoints,
            'weighted_grade_points' => $weightedGrade,
            'weighted_income_points' => $weightedIncome,
            'total_points' => $total,
            'plus_five_points' => $plusFive,
            'final_total_points' => $finalTotal,

            // Backwards-compatible keys used by the current export/report code.
            'gwa' => $grade12Gwa,
            'income_total' => $income,
            'grade_points' => $gradePoints,
            'income_points' => $incomePoints,
            'grade_weighted' => $weightedGrade,
            'income_weighted' => $weightedIncome,
            'plus_five' => $plusFive,
            'final_points' => $finalTotal,
        ];
    }

    /**
     * @param  array<int, string>  $manualReasonKeys
     * @param  array<string, mixed>|null  $programEvaluation
     * @return array{
     *     qualification_status: string,
     *     remarks: string,
     *     remark_reasons: array<int, string>,
     *     scores: array<string, mixed>
     * }
     */
    public function evaluate(CmspApplication $application, array $manualReasonKeys = [], ?array $programEvaluation = null): array
    {
        $scores = $this->computeScores($application);
        $reasons = [];

        if (($scores['income'] ?? 0) > 500000) {
            $reasons[] = self::REASON_INCOME_EXCEEDS;
        }

        $missingAttachments = $this->missingRequiredAttachmentReasons($application);
        $reasons = array_merge($reasons, $missingAttachments);

        if ($this->hasMissingOrInvalidGwa($application)) {
            $reasons[] = self::REASON_NO_GRADES;
        }

        $programEvaluation ??= $this->evaluateSelectedProgram($application);
        if (($programEvaluation['is_priority'] ?? false) !== true) {
            $reasons[] = self::REASON_NOT_PRIORITY_COURSE;
        }

        if (($programEvaluation['is_discontinued'] ?? false) === true) {
            $reasons[] = self::REASON_DISCONTINUED_PROGRAM;
        }

        foreach ($manualReasonKeys as $reasonKey) {
            $label = self::manualDisqualificationReasons()[$reasonKey] ?? null;
            if ($label !== null) {
                $reasons[] = $label;
            }
        }

        $reasons = $this->uniqueReasons($reasons);

        return [
            'qualification_status' => count($reasons) === 0 ? self::QUALIFICATION_QUALIFIED : self::QUALIFICATION_DISQUALIFIED,
            'remarks' => count($reasons) === 0 ? self::QUALIFIED_REMARK : implode(', ', $reasons),
            'remark_reasons' => $reasons,
            'scores' => $scores,
        ];
    }

    /**
     * @return array{is_priority: bool, is_discontinued: bool, matched_program: array<string, mixed>|null}
     */
    public function evaluateSelectedProgram(CmspApplication $application): array
    {
        $schoolName = trim((string) ($application->school?->name ?? $application->intended_school_name ?? $application->other_school ?? ''));
        $courseName = trim((string) ($application->courseModel?->name ?? $application->course_name ?? ''));
        $matchedProgram = null;

        if ($schoolName !== '' && $courseName !== '') {
            try {
                /** @var PortalService $portalService */
                $portalService = app(PortalService::class);
                $hei = collect($portalService->fetchAllHEI())->first(function (array $item) use ($schoolName): bool {
                    $heiName = (string) ($item['instName'] ?? '');

                    return $this->isLooseTextMatch($heiName, $schoolName);
                });

                $instCode = is_array($hei) ? trim((string) ($hei['instCode'] ?? '')) : '';
                if ($instCode !== '') {
                    $matchedProgram = collect($portalService->fetchPrograms($instCode))
                        ->first(fn (array $program): bool => $this->isProgramNameMatch((string) ($program['programName'] ?? ''), $courseName));
                }
            } catch (\Throwable $e) {
                report($e);
            }
        }

        $programName = is_array($matchedProgram) && filled($matchedProgram['programName'] ?? null)
            ? (string) $matchedProgram['programName']
            : $courseName;

        return [
            'is_priority' => $this->isPriorityCourse($programName),
            'is_discontinued' => is_array($matchedProgram) ? $this->isDiscontinuedProgram($matchedProgram) : false,
            'matched_program' => is_array($matchedProgram) ? $matchedProgram : null,
        ];
    }

    public function resolveGrade12Gwa(CmspApplication $application): ?float
    {
        if (! is_numeric($application->gwa_g12_s1) || ! is_numeric($application->gwa_g12_s2)) {
            return null;
        }

        $s1 = (float) $application->gwa_g12_s1;
        $s2 = (float) $application->gwa_g12_s2;

        if ($s1 <= 0 || $s2 <= 0) {
            return null;
        }

        return round(($s1 + $s2) / 2, 2);
    }

    public function mapGradePoints(float $grade): int
    {
        return $this->mapPointsFromReferences(
            $grade,
            ReferencePoint::CATEGORY_GRADE,
            75
        );
    }

    public function mapIncomePoints(float $income): int
    {
        return $this->mapPointsFromReferences(
            $income,
            ReferencePoint::CATEGORY_INCOME,
            0
        );
    }

    public function resolveHouseholdIncome(CmspApplication $application): float
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

        return 0.0;
    }

    public function resolvePlusFivePoints(CmspApplication $application): int
    {
        return $this->requiresSpecialGroupProof($application) && filled($application->proof_of_special_group_path) ? 5 : 0;
    }

    public function isPriorityCourse(string $programName): bool
    {
        if (trim($programName) === '') {
            return false;
        }

        return Course::query()
            ->pluck('name')
            ->contains(fn (string $courseName): bool => $this->isProgramNameMatch($programName, $courseName));
    }

    /**
     * @param  array<string, mixed>  $program
     */
    public function isDiscontinuedProgram(array $program): bool
    {
        $status = $program['status'] ?? null;
        if ((string) $status === '0') {
            return true;
        }

        $statuses = [
            $program['program_status'] ?? null,
            $program['programStatus'] ?? null,
            $program['status_label'] ?? null,
            $program['statusLabel'] ?? null,
        ];

        foreach ($statuses as $value) {
            $normalized = mb_strtolower(trim((string) $value));
            if ($normalized === '0' || $normalized === 'inactive' || str_contains($normalized, 'discontinued') || str_contains($normalized, 'inactive') || str_contains($normalized, 'closed')) {
                return true;
            }
        }

        return false;
    }

    public function isProgramNameMatch(string $programName, string $courseLabel): bool
    {
        $normalizedProgram = $this->normalizeText($programName);
        $compactProgram = str_replace(' ', '', $normalizedProgram);
        $acronymProgram = $this->extractAcronym($programName);
        $normalizedCourse = $this->normalizeText($courseLabel);
        $compactCourse = str_replace(' ', '', $normalizedCourse);
        $acronymCourse = $this->extractAcronym($courseLabel);

        if ($normalizedProgram === '' || $normalizedCourse === '') {
            return false;
        }

        return $normalizedProgram === $normalizedCourse
            || $compactProgram === $compactCourse
            || str_contains($normalizedProgram, $normalizedCourse)
            || str_contains($normalizedCourse, $normalizedProgram)
            || (mb_strlen($acronymProgram) >= 3 && $acronymProgram === $acronymCourse)
            || (mb_strlen($acronymCourse) >= 3 && str_contains($compactProgram, mb_strtolower($acronymCourse)));
    }

    /**
     * @return array<int, string>
     */
    public function missingRequiredAttachmentReasons(CmspApplication $application): array
    {
        $missing = [];

        if (! filled($application->application_form_path)) {
            $missing[] = self::REASON_NO_APPLICATION_FORM;
        }

        if (! filled($application->grades_g12_s1_path) || ! filled($application->grades_g12_s2_path)) {
            $missing[] = self::REASON_INCOMPLETE_GRADES;
        }

        if (! filled($application->birth_certificate_path)) {
            $missing[] = self::REASON_NO_BIRTH_CERTIFICATE;
        }

        if (! filled($application->proof_of_income_path)) {
            $missing[] = self::REASON_NO_PROOF_OF_INCOME;
        }

        if ($this->requiresSpecialGroupProof($application) && ! filled($application->proof_of_special_group_path)) {
            $missing[] = self::REASON_LACKING_SPECIAL_GROUP_PROOF;
        }

        $allCoreMissing = ! filled($application->application_form_path)
            && ! filled($application->grades_g12_s1_path)
            && ! filled($application->grades_g12_s2_path)
            && ! filled($application->birth_certificate_path)
            && ! filled($application->proof_of_income_path);

        if ($allCoreMissing) {
            array_unshift($missing, self::REASON_NO_DOCUMENTS);
        }

        return $this->uniqueReasons($missing);
    }

    private function mapPointsFromReferences(float $value, string $category, int $fallback): int
    {
        $reference = ReferencePoint::query()
            ->where('category', $category)
            ->where('range_from', '<=', $value)
            ->where(function ($query) use ($value): void {
                $query->whereNull('range_to')
                    ->orWhere('range_to', '>=', $value);
            })
            ->orderBy('range_from')
            ->first();

        return $reference ? (int) $reference->equivalent_points : $fallback;
    }

    private function hasMissingOrInvalidGwa(CmspApplication $application): bool
    {
        return $this->resolveGrade12Gwa($application) === null;
    }

    private function requiresSpecialGroupProof(CmspApplication $application): bool
    {
        $groups = $application->special_groups ?? [];
        if (is_string($groups)) {
            $decoded = json_decode($groups, true);
            $groups = is_array($decoded) ? $decoded : [$groups];
        }

        if (! is_array($groups)) {
            return false;
        }

        foreach ($groups as $group) {
            $normalized = $this->normalizeText((string) $group);
            if ($normalized !== '' && ! in_array($normalized, ['n a', 'na', 'none'], true)) {
                return true;
            }
        }

        return false;
    }

    private function normalizeText(string $value): string
    {
        return trim((string) preg_replace('/[^a-z0-9]+/', ' ', mb_strtolower($value)));
    }

    private function extractAcronym(string $value): string
    {
        $stopWords = ['bachelor', 'science', 'arts', 'in', 'of', 'and', 'the', 'major', 'related', 'fields', 'education'];
        $words = array_filter(explode(' ', $this->normalizeText($value)));

        return mb_strtoupper(implode('', array_map(
            static fn (string $word): string => in_array($word, $stopWords, true) ? '' : Str::substr($word, 0, 1),
            $words
        )));
    }

    private function isLooseTextMatch(string $left, string $right): bool
    {
        $left = $this->normalizeText($left);
        $right = $this->normalizeText($right);

        return $left !== ''
            && $right !== ''
            && ($left === $right || str_contains($left, $right) || str_contains($right, $left));
    }

    /**
     * @param  array<int, string>  $reasons
     * @return array<int, string>
     */
    private function uniqueReasons(array $reasons): array
    {
        $seen = [];
        $unique = [];

        foreach ($reasons as $reason) {
            $reason = trim($reason);
            if ($reason === '') {
                continue;
            }

            $key = mb_strtolower($reason);
            if (isset($seen[$key])) {
                continue;
            }

            $seen[$key] = true;
            $unique[] = $reason;
        }

        return $unique;
    }
}

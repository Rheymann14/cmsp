<?php


namespace App\Http\Controllers;

use App\Models\AyDeadline;
use App\Models\CmspApplication;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;
use PhpOffice\PhpSpreadsheet\RichText\RichText;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\NumberFormat;

class CmspApplicationController extends Controller
{
    /** Store to public/attachments with ULID + original filename; returns relative path */
    private function putAttachment(UploadedFile $file, string $dir = 'attachments'): string
    {
        $ulid = (string) Str::ulid(); // sortable unique code
        $original = Str::of($file->getClientOriginalName())
            ->replaceMatches('/[^A-Za-z0-9.\-_]+/', '_')
            ->toString();

        $filename = "{$ulid}__{$original}";
        // Disk 'public' -> storage/app/public
        return $file->storeAs($dir, $filename, 'public'); // e.g. "attachments/01J...__file.pdf"
    }

    private function makeTrackingNo(): string
{
    $year = now()->year;
    do {
        $prefix = Str::upper(Str::random(5)); // A–Z0–9
        $code   = "{$prefix}-{$year}";
    } while (CmspApplication::where('tracking_no', $code)->exists());

    return $code;
}

 public function store(Request $request)
{
    // Normalize empty strings to null so "required_without_all" logic works.
    $nullableKeys = [
        'maiden_name','name_extension','barangay','purok_street','zip_code','district',
        'barmm_province','barmm_municipality','barmm_barangay','barmm_purok_street','barmm_zip_code',
        'other_school','gad_stufaps_course',
    ];
    $input = $request->all();
    foreach ($nullableKeys as $k) {
        if (array_key_exists($k, $input) && $input[$k] === '') {
            $input[$k] = null;
        }
    }
    $request->replace($input);

    $validated = $request->validate([
        // Accept only truthy “yes/on/1/true” values
        'incoming' => ['accepted'],

        'lrn' => ['required','digits:12'],
        'email' => ['required','email'],
        'contact_number' => ['required','regex:/^\d{11}$/'],

        'last_name' => ['required','string','max:100'],
        'first_name' => ['required','string','max:100'],
        'middle_name' => ['required','string','max:100'],
        'maiden_name' => ['nullable','string','max:100'],
        'name_extension' => ['nullable','string','max:20'],

        'ethnicity' => ['required','integer','exists:ethnicities,id'],
        'religion'  => ['required','integer','exists:religions,id'],

        'birthdate' => ['required','date'],
        'sex' => ['required', Rule::in(['male','female'])],

        // Region XII fields are required if ALL BARMM fields are empty
        'province_municipality' => ['nullable','integer','exists:locations,id','required_without_all:barmm_province,barmm_municipality,barmm_barangay,barmm_purok_street,barmm_zip_code'],
        'barangay'              => ['nullable','string','max:150','required_without_all:barmm_province,barmm_municipality,barmm_barangay,barmm_purok_street,barmm_zip_code'],
        'purok_street'          => ['nullable','string','max:150','required_without_all:barmm_province,barmm_municipality,barmm_barangay,barmm_purok_street,barmm_zip_code'],
        'zip_code'              => ['nullable','string','max:12','required_without_all:barmm_province,barmm_municipality,barmm_barangay,barmm_purok_street,barmm_zip_code'],
        'district'              => ['nullable','integer','exists:districts,id','required_without_all:barmm_province,barmm_municipality,barmm_barangay,barmm_purok_street,barmm_zip_code'],

        // BARMM fields are required if ALL Region XII fields are empty
        'barmm_province'     => ['nullable','string','max:150','required_without_all:province_municipality,barangay,purok_street,zip_code,district'],
        'barmm_municipality' => ['nullable','string','max:150','required_without_all:province_municipality,barangay,purok_street,zip_code,district'],
        'barmm_barangay'     => ['nullable','string','max:150','required_without_all:province_municipality,barangay,purok_street,zip_code,district'],
        'barmm_purok_street' => ['nullable','string','max:150','required_without_all:province_municipality,barangay,purok_street,zip_code,district'],
        'barmm_zip_code'     => ['nullable','string','max:12','required_without_all:province_municipality,barangay,purok_street,zip_code,district'],

        'intended_school' => ['required','integer','exists:schools,id'],
        'school_type'     => ['required', Rule::in(['Public','LUC','Private'])],
        'other_school'    => ['nullable','string','max:200'],
        'year_level'      => ['required','string','max:100'],
        'course'          => ['required','integer','exists:courses,id'],

        'gad_stufaps_course' => ['nullable','string','max:255'],

        'shs_name'    => ['required','string','max:200'],
        'shs_address' => ['required','string','max:200'],

        'father_na'        => ['nullable','boolean'],
        'father_deceased'  => ['nullable','boolean'],
        'mother_na'        => ['nullable','boolean'],
        'mother_deceased'  => ['nullable','boolean'],

        'father_name'                  => ['exclude_if:father_na,1', 'exclude_if:father_deceased,1', 'required', 'string', 'max:150'],
        'father_occupation'            => ['exclude_if:father_na,1', 'exclude_if:father_deceased,1', 'required', 'string', 'max:150'],
        'father_income_monthly'        => ['exclude_if:father_na,1', 'exclude_if:father_deceased,1', 'required', 'integer', 'min:0'],
        'father_income_yearly_bracket' => ['exclude_if:father_na,1', 'exclude_if:father_deceased,1', 'required', 'integer', 'min:0'],

        'mother_name'                  => ['exclude_if:mother_na,1', 'exclude_if:mother_deceased,1', 'required', 'string', 'max:150'],
        'mother_occupation'            => ['exclude_if:mother_na,1', 'exclude_if:mother_deceased,1', 'required', 'string', 'max:150'],
        'mother_income_monthly'        => ['exclude_if:mother_na,1', 'exclude_if:mother_deceased,1', 'required', 'integer', 'min:0'],
        'mother_income_yearly_bracket' => ['exclude_if:mother_na,1', 'exclude_if:mother_deceased,1', 'required', 'integer', 'min:0'],

        'guardian_name' => [
            Rule::requiredIf(fn() =>
                (request()->boolean('father_na') || request()->boolean('father_deceased'))
                && (request()->boolean('mother_na') || request()->boolean('mother_deceased'))
            ),
            'nullable','string','max:150'
        ],
        'guardian_occupation' => [
            Rule::requiredIf(fn() =>
                (request()->boolean('father_na') || request()->boolean('father_deceased'))
                && (request()->boolean('mother_na') || request()->boolean('mother_deceased'))
            ),
            'nullable','string','max:150'
        ],
        'guardian_income_monthly' => [
            Rule::requiredIf(fn() =>
                (request()->boolean('father_na') || request()->boolean('father_deceased'))
                && (request()->boolean('mother_na') || request()->boolean('mother_deceased'))
            ),
            'nullable','integer','min:0'
        ],


        // If your UI may send decimals, switch to numeric|between:80,100
        'gwa_g12_s1' => ['required','integer','between:80,100'],
        'gwa_g12_s2' => ['required','integer','between:80,100'],

        'special_groups'   => ['required','array','min:1'],
        'special_groups.*' => ['string','max:80'],

        // Must be truthy value
        'consent' => ['accepted'],

        'application_form' => ['required','file','mimes:pdf','max:10240'],
        'grades_g12_s1'    => ['required','file','mimes:pdf','max:10240'],
        'grades_g12_s2'    => ['required','file','mimes:pdf','max:10240'],
        'birth_certificate'=> ['required','file','mimes:pdf','max:10240'],
        'proof_of_income'  => ['required','file','mimes:pdf','max:10240'],
        'proof_special_group'      => ['nullable','file','mimes:pdf','max:10240'],
        'guardianship_certificate' => ['nullable','file','mimes:pdf','max:10240'],

        'academic_year' => ['required','string','max:50'],
        'deadline'      => ['required','date'],
    ], [
        'consent.accepted'  => 'You must agree to the certification & data privacy consent.',
        'incoming.accepted' => 'Only incoming 1st year students are qualified.',
    ]);

    // Enforce “incoming”
    if (!filter_var($validated['incoming'], FILTER_VALIDATE_BOOLEAN) && $validated['incoming'] !== 'yes') {
        return back()
            ->withErrors(['incoming' => 'Only incoming 1st year students are qualified.'])
            ->withInput();
    }

    // Require special proof only if non-"N/A" chosen
    $needsSpecialProof = collect($validated['special_groups'])
        ->filter(fn($v) => trim($v) !== 'N/A')
        ->isNotEmpty();

    if ($needsSpecialProof) {
        $request->validate([
            'proof_special_group' => ['required','file','mimes:pdf','max:10240'],
        ]);
    }

    // Store files
    $paths = [
        'application_form_path'  => $this->putAttachment($request->file('application_form')),
        'grades_g12_s1_path'     => $this->putAttachment($request->file('grades_g12_s1')),
        'grades_g12_s2_path'     => $this->putAttachment($request->file('grades_g12_s2')),
        'birth_certificate_path' => $this->putAttachment($request->file('birth_certificate')),
        'proof_of_income_path'   => $this->putAttachment($request->file('proof_of_income')),
        'proof_of_special_group_path' => $request->hasFile('proof_special_group')
            ? $this->putAttachment($request->file('proof_special_group')) : null,
        'guardianship_certificate_path' => $request->hasFile('guardianship_certificate')
            ? $this->putAttachment($request->file('guardianship_certificate')) : null,
    ];

    $application = CmspApplication::create([
        'incoming' => true, // store as bool
        'tracking_no' => $this->makeTrackingNo(),
        'lrn'      => $validated['lrn'],
        'email'    => $validated['email'],
        'contact_number' => $validated['contact_number'],

        'last_name'     => $validated['last_name'],
        'first_name'    => $validated['first_name'],
        'middle_name'   => $validated['middle_name'],
        'maiden_name'   => $validated['maiden_name'] ?? null,
        'name_extension'=> $validated['name_extension'] ?? null,

        'ethnicity_id' => $validated['ethnicity'],
        'religion_id'  => $validated['religion'],

        'birthdate' => $validated['birthdate'],
        'sex'       => $validated['sex'],

        'province_municipality' => $validated['province_municipality'] ?? null,
        'barangay'              => $validated['barangay'] ?? null,
        'purok_street'          => $validated['purok_street'] ?? null,
        'zip_code'              => $validated['zip_code'] ?? null,
        'district'              => $validated['district'] ?? null,

        'barmm_province'     => $validated['barmm_province'] ?? null,
        'barmm_municipality' => $validated['barmm_municipality'] ?? null,
        'barmm_barangay'     => $validated['barmm_barangay'] ?? null,
        'barmm_purok_street' => $validated['barmm_purok_street'] ?? null,
        'barmm_zip_code'     => $validated['barmm_zip_code'] ?? null,

        'intended_school' => $validated['intended_school'],
        'school_type'     => $validated['school_type'],
        'other_school'    => $validated['other_school'] ?? null,
        'year_level'      => $validated['year_level'],
        'course'          => $validated['course'],

        'gad_stufaps_course' => $validated['gad_stufaps_course'] ?? null,

        'shs_name'    => $validated['shs_name'],
        'shs_address' => $validated['shs_address'],
 
        'father_name'                  => $validated['father_name']                  ?? null,
        'father_occupation'            => $validated['father_occupation']            ?? null,
        'father_income_monthly'        => $validated['father_income_monthly']        ?? null,
        'father_income_yearly_bracket' => $validated['father_income_yearly_bracket'] ?? null,
        'father_na'        => $request->boolean('father_na'),
        'father_deceased'  => $request->boolean('father_deceased'),

        'mother_name'                  => $validated['mother_name']                  ?? null,
        'mother_occupation'            => $validated['mother_occupation']            ?? null,
        'mother_income_monthly'        => $validated['mother_income_monthly']        ?? null,
        'mother_income_yearly_bracket' => $validated['mother_income_yearly_bracket'] ?? null,
        'mother_na'        => $request->boolean('mother_na'),
        'mother_deceased'  => $request->boolean('mother_deceased'),

        'guardian_name'           => $validated['guardian_name']           ?? null,
        'guardian_occupation'     => $validated['guardian_occupation']     ?? null,
        'guardian_income_monthly' => $validated['guardian_income_monthly'] ?? null,

        'gwa_g12_s1' => $validated['gwa_g12_s1'],
        'gwa_g12_s2' => $validated['gwa_g12_s2'],

        'special_groups' => $validated['special_groups'],
        'consent'        => true,

        'academic_year' => $validated['academic_year'],
        'deadline'      => $validated['deadline'],

        ...$paths,
    ]);

    return back()->with([
        'success' => 'Application submitted!',
        'tracking_no' => $application->tracking_no,
    ]);
}

    


public function exportXlsx(Request $request)
    {
        $term = trim((string) $request->get('search', ''));

        $query = CmspApplication::query()
            ->from('cmsp_applications as a')
            ->select('a.*')
            ->addSelect([
                DB::raw('e.label as ethnicity_name'),
                DB::raw('r.label as religion_name'),
                DB::raw('d.name as district_name'),
                DB::raw('s2.name as intended_school_name'),
                DB::raw('c.name as course_name'),
                DB::raw('CONCAT_WS(", ", l.municipality, l.province) as province_municipality_name'),
                DB::raw('l.municipality as municipality_name'),
                DB::raw('l.province as province_name'),
            ])
            ->leftJoin('ethnicities as e', 'e.id', '=', 'a.ethnicity_id')
            ->leftJoin('religions as r', 'r.id', '=', 'a.religion_id')
            ->leftJoin('locations as l', 'l.id', '=', 'a.province_municipality')
            ->leftJoin('districts as d', 'd.id', '=', 'a.district')
            ->leftJoin('schools as s2', 's2.id', '=', 'a.intended_school')
            ->leftJoin('courses as c', 'c.id', '=', 'a.course');

        if ($term !== '') {
            $query->where(function ($w) use ($term) {
                $like = "%{$term}%";
                $w->where('a.last_name', 'like', $like)
                    ->orWhere('a.first_name', 'like', $like)
                    ->orWhere('a.tracking_no', 'like', $like)
                    ->orWhere('c.name', 'like', $like)
                    ->orWhere('s2.name', 'like', $like)
                    ->orWhere('e.label', 'like', $like)
                    ->orWhere('r.label', 'like', $like)
                    ->orWhere('d.name', 'like', $like)
                    ->orWhere(DB::raw('CONCAT_WS(", ", l.municipality, l.province)'), 'like', $like);
            });
        }

        $applications = $query->get();

        $computed = [];
        foreach ($applications as $application) {
            $gwa = (float) ($application->gwa_g12_s2 ?? 0);
            $gradePoints = $this->mapGradePoints($gwa);
            $incomeTotal = $this->resolveHouseholdIncome($application);
            $incomePoints = $this->mapIncomePoints($incomeTotal);
            $gradeWeighted = round($gradePoints * 0.70, 2);
            $incomeWeighted = round($incomePoints * 0.30, 2);
            $totalPoints = round($gradeWeighted + $incomeWeighted, 2);
            $plusFive = $application->proof_of_special_group_path ? 5 : 0;
            $finalPoints = round($totalPoints + $plusFive, 2);

            $computed[] = [
                'model' => $application,
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
        }

        usort($computed, function (array $a, array $b) {
            if ($a['final_points'] === $b['final_points']) {
                if ($a['total_points'] === $b['total_points']) {
                    if ($a['grade_points'] === $b['grade_points']) {
                        return $a['model']->id <=> $b['model']->id;
                    }

                    return $b['grade_points'] <=> $a['grade_points'];
                }

                return $b['total_points'] <=> $a['total_points'];
            }

            return $b['final_points'] <=> $a['final_points'];
        });

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('CMSP Ranklist');
        $spreadsheet->getDefaultStyle()->getFont()->setName('Arial')->setSize(10);

        $sheet->mergeCells('A1:C1');
        $sheet->setCellValue('A1', 'Annex C - Official Ranklist');
        $sheet->getStyle('A1:C1')->getFont()->setItalic(true)->setSize(10);

        $sheet->mergeCells('A2:B2');
        $sheet->setCellValue('A2', '2025 version');
        $sheet->getStyle('A2:B2')->getFont()->setItalic(true)->setSize(10);

        $sheet->mergeCells('A3:AK3');
        $sheet->setCellValue('A3', 'COMMISSION ON HIGHER EDUCATION');
        $sheet->mergeCells('A4:AK4');
        $sheet->setCellValue('A4', 'REGIONAL OFFICE XII');
        $sheet->getStyle('A3:AK4')->getFont()->setBold(true)->setSize(12);
        $sheet->getStyle('A3:AK4')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells('A6:AK6');
        $sheet->setCellValue('A6', 'CMSP RANKLIST');
        $sheet->mergeCells('A7:AK7');
        $ay = AyDeadline::query()->orderByDesc('deadline')->orderByDesc('id')->first();
        $ayLabel = $ay?->academic_year ?? ($applications->first()->academic_year ?? '');
        $sheet->setCellValue('A7', $ayLabel ? 'AY ' . $ayLabel : 'AY');
        $sheet->getStyle('A6:AK7')->getFont()->setBold(true)->setSize(16);
        $sheet->getStyle('A6:AK7')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

        $sheet->mergeCells('A9:A11');
        $sheet->setCellValue('A9', 'SEQ');

        $sheet->mergeCells('B9:E10');
        $sheet->setCellValue('B9', 'NAME');
        $sheet->setCellValue('B11', 'LAST NAME');
        $sheet->setCellValue('C11', 'FIRST NAME');
        $sheet->setCellValue('D11', 'M.I.');
        $sheet->setCellValue('E11', 'EXTENSION NAME');

        $sheet->mergeCells('F9:F11');
        $sheet->setCellValue('F9', 'SEX');

        $sheet->mergeCells('G9:G11');
        $birthdateHeader = new RichText();
        $birthdateHeader->createTextRun('BIRTHDATE');
        $formatRun = $birthdateHeader->createTextRun(PHP_EOL . 'MM/DD/YYYY');
        $formatRun->getFont()->setSize(8);
        $sheet->setCellValue('G9', $birthdateHeader);

        $sheet->mergeCells('H9:H11');
        $sheet->setCellValue('H9', 'LRN');

        $sheet->mergeCells('I9:I11');
        $sheet->setCellValue('I9', 'CONTACT NUMBER');

        $sheet->mergeCells('J9:J11');
        $sheet->setCellValue('J9', 'EMAIL ADDRESS');

        $sheet->mergeCells('K9:K11');
        $sheet->setCellValue('K9', 'SHS SCHOOL NAME');

        $sheet->mergeCells('L9:L11');
        $sheet->setCellValue('L9', 'SHS TYPE OF SCHOOL');

        $sheet->mergeCells('M9:O10');
        $sheet->setCellValue('M9', 'PERMANENT HOME ADDRESS');
        $sheet->setCellValue('M11', 'BRGY/STREET');
        $sheet->setCellValue('N11', 'TOWN/CITY');
        $sheet->setCellValue('O11', 'PROVINCE');

        $sheet->mergeCells('P9:P11');
        $sheet->setCellValue('P9', 'ZIP CODE');

        $sheet->mergeCells('Q9:Q11');
        $sheet->setCellValue('Q9', 'DISTRICT');

        $sheet->mergeCells('R9:R11');
        $sheet->setCellValue('R9', 'HEI');

        $sheet->mergeCells('S9:S11');
        $sheet->setCellValue('S9', 'TYPE OF SCHOOL');

        $sheet->mergeCells('T9:T11');
        $sheet->setCellValue('T9', 'PROGRAM NAME');

        $sheet->mergeCells('U9:U11');
        $sheet->setCellValue('U9', 'CURRENT YEAR LEVEL');

        $sheet->mergeCells('V9:W9');
        $sheet->setCellValue('V9', 'GIVEN DATA');
        $sheet->mergeCells('V10:V11');
        $sheet->setCellValue('V10', 'GRADE 12 GWA');
        $sheet->mergeCells('W10:W11');
        $sheet->setCellValue('W10', 'INCOME');

        $sheet->mergeCells('X9:Y9');
        $sheet->setCellValue('X9', 'EQUIVALENT POINTS');
        $sheet->mergeCells('X10:X11');
        $sheet->setCellValue('X10', 'GRADE');
        $sheet->mergeCells('Y10:Y11');
        $sheet->setCellValue('Y10', 'INCOME');

        $sheet->mergeCells('Z9:AA9');
        $sheet->setCellValue('Z9', 'PERCENTAGE CRITERIA');
        $sheet->setCellValue('Z10', 'GRADE');
        $sheet->setCellValue('AA10', 'INCOME');
        $sheet->setCellValue('Z11', '70%');
        $sheet->setCellValue('AA11', '30%');

        $sheet->mergeCells('AB9:AB11');
        $sheet->setCellValue('AB9', 'TOTAL POINTS');

        $sheet->mergeCells('AC9:AD11');
        $sheet->setCellValue('AC9', 'TYPE OF SPECIAL GROUP');

        $sheet->mergeCells('AE9:AE11');
        $sheet->setCellValue('AE9', 'PLUS FIVE (5) POINTS (IF APPLICABLE)');

        $sheet->mergeCells('AF9:AF11');
        $sheet->setCellValue('AF9', 'FINAL TOTAL POINTS');

        $sheet->mergeCells('AG9:AG11');
        $sheet->setCellValue('AG9', 'RANK');

        $sheet->mergeCells('AH9:AH11');
        $sheet->setCellValue('AH9', 'STATUS OF DOCUMENTARY REQUIREMENTS');

        $sheet->mergeCells('AI9:AI11');
        $sheet->setCellValue('AI9', 'REMARKS');

        $sheet->mergeCells('AJ9:AJ11');
        $sheet->setCellValue('AJ9', 'NO. OF SIBLINGS');

        $sheet->mergeCells('AK9:AK11');
        $sheet->setCellValue('AK9', 'INITIAL RANK');

        $sheet->getStyle('A9:AK11')->getFont()->setBold(true);
        $sheet->getStyle('A9:AK11')->getAlignment()
            ->setHorizontal(Alignment::HORIZONTAL_CENTER)
            ->setVertical(Alignment::VERTICAL_CENTER)
            ->setWrapText(true);

        $columnWidths = [
            'A' => 6,
            'B' => 18,
            'C' => 18,
            'D' => 8,
            'E' => 12,
            'F' => 8,
            'G' => 14,
            'H' => 16,
            'I' => 16,
            'J' => 28,
            'K' => 30,
            'L' => 18,
            'M' => 22,
            'N' => 20,
            'O' => 24,
            'P' => 12,
            'Q' => 14,
            'R' => 30,
            'S' => 18,
            'T' => 30,
            'U' => 16,
            'V' => 14,
            'W' => 16,
            'X' => 12,
            'Y' => 12,
            'Z' => 14,
            'AA' => 14,
            'AB' => 16,
            'AC' => 28,
            'AD' => 28,
            'AE' => 18,
            'AF' => 18,
            'AG' => 10,
            'AH' => 26,
            'AI' => 20,
            'AJ' => 16,
            'AK' => 14,
        ];

        foreach ($columnWidths as $column => $width) {
            $sheet->getColumnDimension($column)->setWidth($width);
        }

        $sheet->freezePane('A12');

        $startRow = 12;
        foreach ($computed as $index => $entry) {
            /** @var CmspApplication $app */
            $app = $entry['model'];
            $row = $startRow + $index;

            $middleInitial = $app->middle_name ? mb_substr($app->middle_name, 0, 1) . '.' : '';
            $barangay = $app->barangay ?: $app->barmm_barangay;
            $street = $app->purok_street ?: $app->barmm_purok_street;
            $addressLine = trim(collect([$barangay, $street])->filter()->implode(', '));
            $municipality = $app->municipality_name ?: $app->barmm_municipality;
            $province = $app->province_name ?: $app->barmm_province;
            $provinceDisplay = $app->province_municipality_name;
            if (!$provinceDisplay && ($province || $municipality)) {
                $provinceDisplay = collect([$municipality, $province])->filter()->implode(', ');
            }

            $hei = $app->intended_school_name ?: ($app->other_school ?: '');
            $specialGroups = $app->special_groups ?? [];
            if (is_string($specialGroups)) {
                $decoded = json_decode($specialGroups, true);
                $specialGroups = is_array($decoded) ? $decoded : [$specialGroups];
            }
            $specialGroupText = collect($specialGroups)
                ->filter(fn($v) => (string) $v !== '')
                ->implode(', ');

            $yearLevel = $app->year_level;
            $currentYear = $app->incoming ? '1' : $yearLevel;
            if (!$app->incoming && is_string($yearLevel)) {
                if (preg_match('/\d+/', $yearLevel, $matches)) {
                    $currentYear = $matches[0];
                }
            }

            $sheet->setCellValue("A{$row}", $index + 1);
            $sheet->setCellValue("B{$row}", strtoupper($app->last_name));
            $sheet->setCellValue("C{$row}", strtoupper($app->first_name));
            $sheet->setCellValue("D{$row}", strtoupper($middleInitial));
            $sheet->setCellValue("E{$row}", strtoupper((string) ($app->name_extension ?? '')));
            $sheet->setCellValue("F{$row}", strtoupper((string) $app->sex));

            if ($app->birthdate) {
                $sheet->setCellValue("G{$row}", ExcelDate::PHPToExcel($app->birthdate));
                $sheet->getStyle("G{$row}")->getNumberFormat()->setFormatCode('mm/dd/yyyy');
            } else {
                $sheet->setCellValue("G{$row}", '');
            }

            $sheet->setCellValueExplicit("H{$row}", $app->lrn, \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("I{$row}", $app->contact_number, \PhpOffice\PhpSpreadsheet\Cell\DataType::TYPE_STRING);
            $sheet->setCellValue("J{$row}", strtolower($app->email));
            $sheet->setCellValue("K{$row}", $app->shs_name);
            $sheet->setCellValue("L{$row}", $app->shs_school_type ?? '');
            $sheet->setCellValue("M{$row}", $addressLine);
            $sheet->setCellValue("N{$row}", $municipality);
            $sheet->setCellValue("O{$row}", $provinceDisplay);
            $zip = $app->zip_code ?: $app->barmm_zip_code;
            if ($zip !== null && $zip !== '') {
                $sheet->setCellValueExplicit("P{$row}", (string) $zip, DataType::TYPE_STRING);
            } else {
                $sheet->setCellValue("P{$row}", '');
            }
            $sheet->setCellValue("Q{$row}", $app->district_name ?: '');
            $sheet->setCellValue("R{$row}", $hei);
            $sheet->setCellValue("S{$row}", $app->school_type);
            $sheet->setCellValue("T{$row}", $app->course_name ?: $app->course);
            $sheet->setCellValue("U{$row}", $currentYear);
            $sheet->setCellValue("V{$row}", $entry['gwa']);
            $sheet->setCellValue("W{$row}", $entry['income_total']);
            $sheet->setCellValue("X{$row}", $entry['grade_points']);
            $sheet->setCellValue("Y{$row}", $entry['income_points']);
            $sheet->setCellValue("Z{$row}", $entry['grade_weighted']);
            $sheet->setCellValue("AA{$row}", $entry['income_weighted']);
            $sheet->setCellValue("AB{$row}", $entry['total_points']);
            $sheet->setCellValue("AC{$row}", $specialGroupText);
            $sheet->setCellValue("AD{$row}", '');
            $sheet->setCellValue("AE{$row}", $entry['plus_five']);
            $sheet->setCellValue("AF{$row}", $entry['final_points']);
            $sheet->setCellValue("AG{$row}", $index + 1);
            $sheet->setCellValue("AH{$row}", '');
            $sheet->setCellValue("AI{$row}", '');
            $sheet->setCellValue("AJ{$row}", '');
            $sheet->setCellValue("AK{$row}", '');
        }

        $lastRow = $startRow + count($computed) - 1;
        if ($lastRow < 11) {
            $lastRow = 11;
        }

        $sheet->getStyle("A9:AK{$lastRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);

        if ($lastRow >= $startRow) {
            $sheet->getStyle("V{$startRow}:AF{$lastRow}")->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_NUMBER_00);
            $sheet->getStyle("W{$startRow}:W{$lastRow}")->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_NUMBER_COMMA_SEPARATED1);
            $sheet->getStyle("AE{$startRow}:AE{$lastRow}")->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_NUMBER);
            $sheet->getStyle("AG{$startRow}:AG{$lastRow}")->getNumberFormat()->setFormatCode(NumberFormat::FORMAT_NUMBER);
        }

        if ($lastRow >= $startRow) {
            $sheet->getStyle("B{$startRow}:AD{$lastRow}")->getAlignment()->setWrapText(true);
        }

        $filename = 'cmspranklist-' . now()->format('Ymd-His') . '.xlsx';
        $writer = new Xlsx($spreadsheet);

        return response()->streamDownload(static function () use ($writer) {
            $writer->save('php://output');
        }, $filename, [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ]);
    }

    public function indexJson(\Illuminate\Http\Request $request)
{
    $perPage = (int) $request->integer('per_page', 10);
    $term = trim((string) $request->get('search', ''));

    $q = \App\Models\CmspApplication::query()
        ->from('cmsp_applications as a')
        // lookups
        ->leftJoin('ethnicities as e', 'e.id', '=', 'a.ethnicity_id')       // e.label
        ->leftJoin('religions  as r', 'r.id', '=', 'a.religion_id')         // r.label
        ->leftJoin('locations  as l', 'l.id', '=', 'a.province_municipality') // l.province, l.municipality
        ->leftJoin('districts  as d', 'd.id', '=', 'a.district')            // d.name
        ->leftJoin('schools    as s2','s2.id','=', 'a.intended_school')     // s2.name
        ->leftJoin('courses    as c', 'c.id', '=', 'a.course')              // c.name
        ->select([
            'a.*',
            DB::raw("e.label as ethnicity_name"),
            DB::raw("r.label as religion_name"),
            DB::raw("d.name  as district_name"),
            DB::raw("s2.name as intended_school_name"),
            DB::raw("c.name  as course_name"),
            // Combine province + municipality for display/search
            DB::raw("CONCAT_WS(', ', l.municipality, l.province) as province_municipality_name"),
        ])
        ->latest('a.created_at');

    if ($term !== '') {
        $q->where(function ($w) use ($term) {
            $like = "%{$term}%";
            $w->where('a.last_name', 'like', $like)
              ->orWhere('a.first_name','like', $like)
              ->orWhere('a.tracking_no','like', $like)
              // human-readable lookups:
              ->orWhere('c.name',  'like', $like)
              ->orWhere('s2.name', 'like', $like)
              ->orWhere('e.label','like', $like)
              ->orWhere('r.label','like', $like)
              ->orWhere('d.name', 'like', $like)
              ->orWhere(DB::raw("CONCAT_WS(', ', l.municipality, l.province)"), 'like', $like);
        });
    }

    $apps = $q->paginate($perPage)->appends($request->all());

    return response()->json([
        'data' => $apps->items(),
        'meta' => [
            'current_page' => $apps->currentPage(),
            'per_page'     => $apps->perPage(),
            'total'        => $apps->total(),
            'last_page'    => $apps->lastPage(),
        ],
    ]);
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

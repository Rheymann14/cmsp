<?php


namespace App\Http\Controllers;

use App\Models\CmspApplication;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

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




}

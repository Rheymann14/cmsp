<?php


namespace App\Http\Controllers;

use App\Models\CmspApplication;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

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

    public function store(Request $request)
    {
        // 1) Base validation
        $validated = $request->validate([
            'incoming' => ['required', Rule::in(['yes','no'])],
            'lrn' => ['required','digits:12'],
            'email' => ['required','email'],
            'contact_number' => ['required','string','max:50'],
            'last_name' => ['required','string','max:100'],
            'first_name' => ['required','string','max:100'],
            'middle_name' => ['required','string','max:100'],
            'maiden_name' => ['nullable','string','max:100'],
            'name_extension' => ['nullable','string','max:20'],

            'birthdate' => ['required','date'],
            'sex' => ['required', Rule::in(['male','female'])],

            'province_municipality' => ['required','integer'],
            'barangay' => ['required','string','max:150'],
            'purok_street' => ['required','string','max:150'],
            'zip_code' => ['nullable','string','max:12'],
            'district' => ['required','integer'],

            'intended_school' => ['required','integer'],
            'school_type' => ['required', Rule::in(['Public','LUC','Private'])],
            'other_school' => ['nullable','string','max:200'],
            'year_level' => ['required','string','max:100'],
            'course' => ['required','integer'],

            'shs_name' => ['required','string','max:200'],
            'shs_address' => ['required','string','max:200'],

            'father_name' => ['required','string','max:150'],
            'father_occupation' => ['required','string','max:150'],
            'father_income_monthly' => ['required','integer','min:0'],
            'father_income_yearly_bracket' => ['required','string','max:50'],

            'mother_name' => ['required','string','max:150'],
            'mother_occupation' => ['required','string','max:150'],
            'mother_income_monthly' => ['required','integer','min:0'],
            'mother_income_yearly_bracket' => ['required','string','max:50'],

            'guardian_name' => ['required','string','max:150'],
            'guardian_occupation' => ['required','string','max:150'],
            'guardian_income_monthly' => ['required','integer','min:0'],

            'gwa_g11_s1' => ['required','integer','between:80,100'],
            'gwa_g11_s2' => ['required','integer','between:80,100'],
            'gwa_g12_s1' => ['required','integer','between:80,100'],

            'special_groups' => ['required','array','min:1'],
            'special_groups.*' => ['string','max:80'],

            'consent' => ['required', Rule::in(['yes'])],

            // Files
            'application_form' => ['required','file','mimes:pdf','max:10240'],
            'grades_g11_s1' => ['required','file','mimes:pdf','max:10240'],
            'grades_g11_s2' => ['required','file','mimes:pdf','max:10240'],
            'grades_g12_s1' => ['required','file','mimes:pdf','max:10240'],
            'birth_certificate' => ['required','file','mimes:pdf','max:10240'],
            'proof_of_income' => ['required','file','mimes:pdf','max:10240'],
            'proof_special_group' => ['nullable','file','mimes:pdf','max:10240'],
            'guardianship_certificate' => ['nullable','file','mimes:pdf','max:10240'],
            'academic_year' => ['required','string','max:50'],
            'deadline'      => ['required','date'],
        ], [
            'consent.in' => 'You must agree to the certification & data privacy consent.',
            'incoming.in' => 'Only incoming 1st year students are qualified.',
        ]);

        // 2) Enforce incoming = yes
        if ($validated['incoming'] !== 'yes') {
            return back()
                ->withErrors(['incoming' => 'Only incoming 1st year students are qualified.'])
                ->withInput();
        }

        // 3) Conditionally require "proof_special_group" if any group except "N/A" was chosen
        $needsSpecialProof = collect($validated['special_groups'])
            ->filter(fn($v) => trim($v) !== 'N/A')
            ->isNotEmpty();

        if ($needsSpecialProof) {
            $request->validate([
                'proof_special_group' => ['required','file','mimes:pdf','max:10240'],
            ]);
        }

        // 4) Store files under storage/app/public/attachments (disk "public")
        $paths = [
            'application_form_path'       => $this->putAttachment($request->file('application_form')),
            'grades_g11_s1_path'          => $this->putAttachment($request->file('grades_g11_s1')),
            'grades_g11_s2_path'          => $this->putAttachment($request->file('grades_g11_s2')),
            'grades_g12_s1_path'          => $this->putAttachment($request->file('grades_g12_s1')),
            'birth_certificate_path'      => $this->putAttachment($request->file('birth_certificate')),
            'proof_of_income_path'        => $this->putAttachment($request->file('proof_of_income')),
            'proof_of_special_group_path' => $request->hasFile('proof_special_group')
                ? $this->putAttachment($request->file('proof_special_group')) : null,
            'guardianship_certificate_path' => $request->hasFile('guardianship_certificate')
                ? $this->putAttachment($request->file('guardianship_certificate')) : null,
        ];

        // 5) Persist everything
        $app = CmspApplication::create([
            'incoming' => true,
            'lrn' => $validated['lrn'],
            'email' => $validated['email'],
            'contact_number' => $validated['contact_number'],
            'last_name' => $validated['last_name'],
            'first_name' => $validated['first_name'],
            'middle_name' => $validated['middle_name'],
            'maiden_name' => $validated['maiden_name'] ?? null,
            'name_extension' => $validated['name_extension'] ?? null,

            'birthdate' => $validated['birthdate'],
            'sex' => $validated['sex'],

            'province_municipality' => $validated['province_municipality'],
            'barangay' => $validated['barangay'],
            'purok_street' => $validated['purok_street'],
            'zip_code' => $validated['zip_code'] ?? null,
            'district' => $validated['district'],

            'intended_school' => $validated['intended_school'],
            'school_type' => $validated['school_type'],
            'other_school' => $validated['other_school'] ?? null,
            'year_level' => $validated['year_level'],
            'course' => $validated['course'],

            'shs_name' => $validated['shs_name'],
            'shs_address' => $validated['shs_address'],

            'father_name' => $validated['father_name'],
            'father_occupation' => $validated['father_occupation'],
            'father_income_monthly' => $validated['father_income_monthly'],
            'father_income_yearly_bracket' => $validated['father_income_yearly_bracket'],

            'mother_name' => $validated['mother_name'],
            'mother_occupation' => $validated['mother_occupation'],
            'mother_income_monthly' => $validated['mother_income_monthly'],
            'mother_income_yearly_bracket' => $validated['mother_income_yearly_bracket'],

            'guardian_name' => $validated['guardian_name'],
            'guardian_occupation' => $validated['guardian_occupation'],
            'guardian_income_monthly' => $validated['guardian_income_monthly'],

            'gwa_g11_s1' => $validated['gwa_g11_s1'],
            'gwa_g11_s2' => $validated['gwa_g11_s2'],
            'gwa_g12_s1' => $validated['gwa_g12_s1'],

            'special_groups' => $validated['special_groups'],
            'consent' => true,
            'academic_year' => $validated['academic_year'],
            'deadline'      => $validated['deadline'],  

            // File paths
            ...$paths,
        ]);

        return back()->with('success', 'Application submitted!');
    }
}

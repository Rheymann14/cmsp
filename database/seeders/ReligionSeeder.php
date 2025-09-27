<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Religion;

class ReligionSeeder extends Seeder
{
    public function run(): void
    {
    $items = [
        'Roman Catholic',
        'Islam (Muslim)',
        'Iglesia ni Cristo',
        'Evangelical / Protestant',
        'Seventh-day Adventist',
        'Aglipayan (Iglesia Filipina Independiente)',       
        'None / Non-religious',
        'Prefer not to say',
    ];

        foreach ($items as $label) {
            Religion::firstOrCreate(['label' => $label], ['is_active' => true]);
        }
    }
}

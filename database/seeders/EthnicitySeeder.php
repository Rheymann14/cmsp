<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Ethnicity;

class EthnicitySeeder extends Seeder
{
    public function run(): void
    {
        
            $items = [
            // Major lowland/migrant groups
            'Hiligaynon (Ilonggo)', // largest share in Region XII
            'Cebuano (Bisaya)',
            'Ilocano',
            'Tagalog',
        
            // Bangsamoro groups present in the region
            'Maguindanaon',
            'Maranao',
            'Iranun',
        
            // Indigenous peoples of Region XII
            "Blaan",
            "T'boli",
            'Tagakaulo',
            'Manobo',
            'Teduray',
            'Sangil (Sangir)',
        
            // General options
            'Others',
            'Prefer not to say',
        ];

        foreach ($items as $label) {
            Ethnicity::firstOrCreate(['label' => $label], ['is_active' => true]);
        }
    }
}

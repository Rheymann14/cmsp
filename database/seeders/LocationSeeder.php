<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Location;

class LocationSeeder extends Seeder
{
    public function run(): void
    {
        $locations = [
            ['province' => 'Cotabato', 'municipality' => 'Kidapawan'],
            ['province' => 'Cotabato', 'municipality' => 'Alamada'],
            ['province' => 'Cotabato', 'municipality' => 'Aleosan'],
            ['province' => 'South Cotabato', 'municipality' => 'Koronadal'],
           
        ];

        foreach ($locations as $loc) {
            Location::create($loc);
        }
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\District;

class DistrictSeeder extends Seeder
{
    public function run(): void
    {
        $districts = [
            ['name' => '1st District of South Cotabato'],
            ['name' => '2nd District of South Cotabato'],
            ['name' => 'Lone District of Sarangani'],
            ['name' => 'Lone District of General Santos City'],
            ['name' => '1st District of Sultan Kudarat'],
            ['name' => '2nd District of Sultan Kudarat'],
            ['name' => '1st District of North Cotabato'],
            ['name' => '2nd District of North Cotabato'],
            ['name' => '3rd District of North Cotabato'],
            ['name' => '1st District of Maguindanao'],
            ['name' => '2nd District of Maguindanao'],
        ];

        foreach ($districts as $d) {
            District::create($d);
        }
    }
}

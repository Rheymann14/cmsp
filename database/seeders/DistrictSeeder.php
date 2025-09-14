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
        ];

        foreach ($districts as $d) {
            District::create($d);
        }
    }
}


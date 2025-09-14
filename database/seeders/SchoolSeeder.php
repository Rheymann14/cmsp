<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\School;

class SchoolSeeder extends Seeder
{
    public function run(): void
    {
        $schools = [
            ['name' => 'ACLC College of Marbel'],
            ['name' => 'Adventist College of Technology, Inc.'],
            ['name' => 'South Cotabato State College'],
        ];

        foreach ($schools as $s) {
            School::create($s);
        }
    }
}

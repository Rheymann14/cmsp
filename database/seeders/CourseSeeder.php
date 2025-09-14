<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Course;

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        $courses = [
            ['name' => 'Bachelor of Science in Criminology'],
            ['name' => 'Bachelor of Science in Agriculture and Agriculture Related Fields'],
            ['name' => 'Bachelor of Arts in Islamic Studies'],
        ];

        foreach ($courses as $c) {
            Course::create($c);
        }
    }
}

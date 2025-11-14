<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            DistrictSeeder::class,
            LocationSeeder::class,
            SchoolSeeder::class,
            CourseSeeder::class,
            EthnicitySeeder::class,
            ReligionSeeder::class,
            ReferencePointSeeder::class,

        ]);
    }
}

<?php

namespace Database\Seeders;

use App\Models\ReferencePoint;
use Illuminate\Database\Seeder;

class ReferencePointSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $gradePoints = [
            ['range_from' => 0.00,   'range_to' => 90.49, 'equivalent_points' => 75],
            ['range_from' => 91.00,  'range_to' => 92.49, 'equivalent_points' => 80],
            ['range_from' => 93.00,  'range_to' => 94.99, 'equivalent_points' => 85],
            ['range_from' => 95.00,  'range_to' => 96.49, 'equivalent_points' => 90],
            ['range_from' => 97.00,  'range_to' => 98.49, 'equivalent_points' => 95],
            ['range_from' => 99.00,  'range_to' => 100.00, 'equivalent_points' => 100],
        ];

        $incomePoints = [
            ['range_from' => 0.00,     'range_to' => 100000.00, 'equivalent_points' => 100],
            ['range_from' => 100001.00, 'range_to' => 200000.00, 'equivalent_points' => 85],
            ['range_from' => 200001.00, 'range_to' => 300000.00, 'equivalent_points' => 70],
            ['range_from' => 300001.00, 'range_to' => 400000.00, 'equivalent_points' => 55],
            ['range_from' => 400001.00, 'range_to' => 500000.00, 'equivalent_points' => 40],
            ['range_from' => 500001.00, 'range_to' => null,       'equivalent_points' => 0],
        ];

        ReferencePoint::truncate();

        ReferencePoint::query()->insert(array_map(
            static fn (array $entry) => [
                'category' => ReferencePoint::CATEGORY_GRADE,
                'range_from' => $entry['range_from'],
                'range_to' => $entry['range_to'],
                'equivalent_points' => $entry['equivalent_points'],
                'created_at' => now(),
                'updated_at' => now(),
            ],
            $gradePoints
        ));

        ReferencePoint::query()->insert(array_map(
            static fn (array $entry) => [
                'category' => ReferencePoint::CATEGORY_INCOME,
                'range_from' => $entry['range_from'],
                'range_to' => $entry['range_to'],
                'equivalent_points' => $entry['equivalent_points'],
                'created_at' => now(),
                'updated_at' => now(),
            ],
            $incomePoints
        ));
    }
}

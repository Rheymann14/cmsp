<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Location;

class LocationSeeder extends Seeder
{
    public function run(): void
    {
        $locations = [
            // Cotabato
            ['province' => 'Cotabato', 'municipality' => 'Kidapawan'],
            ['province' => 'Cotabato', 'municipality' => 'Alamada'],
            ['province' => 'Cotabato', 'municipality' => 'Aleosan'],
            ['province' => 'Cotabato', 'municipality' => 'Antipas'],
            ['province' => 'Cotabato', 'municipality' => 'Arakan'],
            ['province' => 'Cotabato', 'municipality' => 'Banisilan'],
            ['province' => 'Cotabato', 'municipality' => 'Carmen'],
            ['province' => 'Cotabato', 'municipality' => 'Kabacan'],
            ['province' => 'Cotabato', 'municipality' => 'Libungan'],
            ['province' => 'Cotabato', 'municipality' => 'Magpet'],
            ['province' => 'Cotabato', 'municipality' => 'Makilala'],
            ['province' => 'Cotabato', 'municipality' => 'Matalam'],
            ['province' => 'Cotabato', 'municipality' => 'Midsayap'],
            ['province' => 'Cotabato', 'municipality' => "M'lang"],
            ['province' => 'Cotabato', 'municipality' => 'Pigcawayan'],
            ['province' => 'Cotabato', 'municipality' => 'Pikit'],
            ['province' => 'Cotabato', 'municipality' => 'President Roxas'],
            ['province' => 'Cotabato', 'municipality' => 'Tulunan'],

            // South Cotabato
            ['province' => 'South Cotabato', 'municipality' => 'Koronadal'],
            ['province' => 'South Cotabato', 'municipality' => 'Banga'],
            ['province' => 'South Cotabato', 'municipality' => 'Lake Sebu'],
            ['province' => 'South Cotabato', 'municipality' => 'Norala'],
            ['province' => 'South Cotabato', 'municipality' => 'Polomolok'],
            ['province' => 'South Cotabato', 'municipality' => 'Santo Niño'],
            ['province' => 'South Cotabato', 'municipality' => 'Surallah'],
            ['province' => 'South Cotabato', 'municipality' => 'Tampakan'],
            ['province' => 'South Cotabato', 'municipality' => 'Tantangan'],
            ['province' => 'South Cotabato', 'municipality' => "T'boli"],
            ['province' => 'South Cotabato', 'municipality' => 'Tupi'],

            // Sultan Kudarat
            ['province' => 'Sultan Kudarat', 'municipality' => 'Tacurong'],
            ['province' => 'Sultan Kudarat', 'municipality' => 'Bagumbayan'],
            ['province' => 'Sultan Kudarat', 'municipality' => 'Columbio'],
            ['province' => 'Sultan Kudarat', 'municipality' => 'Esperanza'],
            ['province' => 'Sultan Kudarat', 'municipality' => 'Isulan'],
            ['province' => 'Sultan Kudarat', 'municipality' => 'Kalamansig'],
            ['province' => 'Sultan Kudarat', 'municipality' => 'Lambayong'],
            ['province' => 'Sultan Kudarat', 'municipality' => 'Lebak'],
            ['province' => 'Sultan Kudarat', 'municipality' => 'Lutayan'],
            ['province' => 'Sultan Kudarat', 'municipality' => 'Palimbang'],
            ['province' => 'Sultan Kudarat', 'municipality' => 'President Quirino'],
            ['province' => 'Sultan Kudarat', 'municipality' => 'Senator Ninoy Aquino'],

            // Sarangani
            ['province' => 'Sarangani', 'municipality' => 'Alabel'],
            ['province' => 'Sarangani', 'municipality' => 'Glan'],
            ['province' => 'Sarangani', 'municipality' => 'Kiamba'],
            ['province' => 'Sarangani', 'municipality' => 'Maasim'],
            ['province' => 'Sarangani', 'municipality' => 'Maitum'],
            ['province' => 'Sarangani', 'municipality' => 'Malapatan'],
            ['province' => 'Sarangani', 'municipality' => 'Malungon'],

            // Independent city
            ['province' => 'General Santos City', 'municipality' => 'General Santos City'],
        ];

        foreach ($locations as $loc) {
            Location::create($loc);
        }
    }
}

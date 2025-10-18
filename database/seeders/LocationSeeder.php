<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Location;
use App\Models\District;

class LocationSeeder extends Seeder
{
    public function run(): void
    {
        $locations = [
            // Cotabato
            ['province' => 'Cotabato', 'municipality' => 'Kidapawan', 'district' => '2nd District of North Cotabato'],
            ['province' => 'Cotabato', 'municipality' => 'Alamada', 'district' => '1st District of North Cotabato'],
            ['province' => 'Cotabato', 'municipality' => 'Aleosan', 'district' => '1st District of North Cotabato'],
            ['province' => 'Cotabato', 'municipality' => 'Antipas', 'district' => '2nd District of North Cotabato'],
            ['province' => 'Cotabato', 'municipality' => 'Arakan', 'district' => '2nd District of North Cotabato'],
            ['province' => 'Cotabato', 'municipality' => 'Banisilan', 'district' => '1st District of North Cotabato'],
            ['province' => 'Cotabato', 'municipality' => 'Carmen', 'district' => '1st District of North Cotabato'],
            ['province' => 'Cotabato', 'municipality' => 'Kabacan', 'district' => '3rd District of North Cotabato'],
            ['province' => 'Cotabato', 'municipality' => 'Libungan', 'district' => '1st District of North Cotabato'],
            ['province' => 'Cotabato', 'municipality' => 'Magpet', 'district' => '2nd District of North Cotabato'],
            ['province' => 'Cotabato', 'municipality' => 'Makilala', 'district' => '2nd District of North Cotabato'],
            ['province' => 'Cotabato', 'municipality' => 'Matalam', 'district' => '3rd District of North Cotabato'],
            ['province' => 'Cotabato', 'municipality' => 'Midsayap', 'district' => '1st District of North Cotabato'],
            ['province' => 'Cotabato', 'municipality' => "M'lang", 'district' => '3rd District of North Cotabato'],
            ['province' => 'Cotabato', 'municipality' => 'Pigcawayan', 'district' => '1st District of North Cotabato'],
            ['province' => 'Cotabato', 'municipality' => 'Pikit', 'district' => '1st District of North Cotabato'],
            ['province' => 'Cotabato', 'municipality' => 'President Roxas', 'district' => '2nd District of North Cotabato'],
            ['province' => 'Cotabato', 'municipality' => 'Tulunan', 'district' => '3rd District of North Cotabato'],

            // South Cotabato
            ['province' => 'South Cotabato', 'municipality' => 'Koronadal', 'district' => '2nd District of South Cotabato'],
            ['province' => 'South Cotabato', 'municipality' => 'Banga', 'district' => '2nd District of South Cotabato'],
            ['province' => 'South Cotabato', 'municipality' => 'Lake Sebu', 'district' => '2nd District of South Cotabato'],
            ['province' => 'South Cotabato', 'municipality' => 'Norala', 'district' => '2nd District of South Cotabato'],
            ['province' => 'South Cotabato', 'municipality' => 'Polomolok', 'district' => '1st District of South Cotabato'],
            ['province' => 'South Cotabato', 'municipality' => 'Santo Niño', 'district' => '2nd District of South Cotabato'],
            ['province' => 'South Cotabato', 'municipality' => 'Surallah', 'district' => '2nd District of South Cotabato'],
            ['province' => 'South Cotabato', 'municipality' => 'Tampakan', 'district' => '1st District of South Cotabato'],
            ['province' => 'South Cotabato', 'municipality' => 'Tantangan', 'district' => '2nd District of South Cotabato'],
            ['province' => 'South Cotabato', 'municipality' => "T'boli", 'district' => '2nd District of South Cotabato'],
            ['province' => 'South Cotabato', 'municipality' => 'Tupi', 'district' => '1st District of South Cotabato'],

            // Sultan Kudarat
            ['province' => 'Sultan Kudarat', 'municipality' => 'Tacurong', 'district' => '1st District of Sultan Kudarat'],
            ['province' => 'Sultan Kudarat', 'municipality' => 'Bagumbayan', 'district' => '2nd District of Sultan Kudarat'],
            ['province' => 'Sultan Kudarat', 'municipality' => 'Columbio', 'district' => '2nd District of Sultan Kudarat'],
            ['province' => 'Sultan Kudarat', 'municipality' => 'Esperanza', 'district' => '2nd District of Sultan Kudarat'],
            ['province' => 'Sultan Kudarat', 'municipality' => 'Isulan', 'district' => '1st District of Sultan Kudarat'],
            ['province' => 'Sultan Kudarat', 'municipality' => 'Kalamansig', 'district' => '2nd District of Sultan Kudarat'],
            ['province' => 'Sultan Kudarat', 'municipality' => 'Lambayong', 'district' => '1st District of Sultan Kudarat'],
            ['province' => 'Sultan Kudarat', 'municipality' => 'Lebak', 'district' => '2nd District of Sultan Kudarat'],
            ['province' => 'Sultan Kudarat', 'municipality' => 'Lutayan', 'district' => '1st District of Sultan Kudarat'],
            ['province' => 'Sultan Kudarat', 'municipality' => 'Palimbang', 'district' => '2nd District of Sultan Kudarat'],
            ['province' => 'Sultan Kudarat', 'municipality' => 'President Quirino', 'district' => '1st District of Sultan Kudarat'],
            ['province' => 'Sultan Kudarat', 'municipality' => 'Senator Ninoy Aquino', 'district' => '2nd District of Sultan Kudarat'],

            // Sarangani
            ['province' => 'Sarangani', 'municipality' => 'Alabel', 'district' => 'Lone District of Sarangani'],
            ['province' => 'Sarangani', 'municipality' => 'Glan', 'district' => 'Lone District of Sarangani'],
            ['province' => 'Sarangani', 'municipality' => 'Kiamba', 'district' => 'Lone District of Sarangani'],
            ['province' => 'Sarangani', 'municipality' => 'Maasim', 'district' => 'Lone District of Sarangani'],
            ['province' => 'Sarangani', 'municipality' => 'Maitum', 'district' => 'Lone District of Sarangani'],
            ['province' => 'Sarangani', 'municipality' => 'Malapatan', 'district' => 'Lone District of Sarangani'],
            ['province' => 'Sarangani', 'municipality' => 'Malungon', 'district' => 'Lone District of Sarangani'],

            // Independent city
            ['province' => 'General Santos City', 'municipality' => 'General Santos City', 'district' => 'Lone District of General Santos City'],
        ];

        $districtIds = District::pluck('id', 'name');

        foreach ($locations as $loc) {
            $districtId = $districtIds[$loc['district']] ?? null;

            Location::create([
                'province' => $loc['province'],
                'municipality' => $loc['municipality'],
                'district_id' => $districtId,
            ]);
        }
    }
}

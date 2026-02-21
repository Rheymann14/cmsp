<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class PortalService
{
    protected string $baseUrl = 'https://portal.chedro12.com/api';
    protected string $programsPath = '/fetch-programs';
    protected string $allHeiPath = '/fetch-all-hei';

    protected int $timeout = 30;
    protected int $retries = 3;
    protected int $backoff = 500;
    protected int $cacheTtl = 600;

    protected string $apiKey = '';

    public function __construct()
    {
        $this->apiKey = (string) env('PORTAL_API', '');
    }

    public function fetchAllHEI(): array
    {
        return Cache::remember('portal_all_hei', $this->cacheTtl, function (): array {
            if ($this->apiKey === '') {
                return [];
            }

            try {
                $response = Http::withHeaders([
                    'PORTAL-API' => $this->apiKey,
                    'Accept' => 'application/json',
                ])
                    ->timeout($this->timeout)
                    ->retry($this->retries, $this->backoff)
                    ->get($this->baseUrl . $this->allHeiPath);

                if (! $response->ok()) {
                    return [];
                }

                $data = $this->normalize($response->json());

                return collect($data)
                    ->map(fn ($item) => [
                        'instCode' => $item['instCode'] ?? null,
                        'instName' => $item['instName'] ?? null,
                        'province' => $item['province'] ?? null,
                        'municipalityCity' => $item['municipalityCity'] ?? null,
                    ])
                    ->filter(fn ($item) => filled($item['instCode']) && filled($item['instName']))
                    ->sortBy('instName', SORT_NATURAL | SORT_FLAG_CASE)
                    ->values()
                    ->all();
            } catch (\Throwable $e) {
                report($e);

                return [];
            }
        });
    }

    public function fetchPrograms(string $instCode): array
    {
        $instCode = trim($instCode);
        if ($instCode === '') {
            return [];
        }

        return Cache::remember("portal_programs_{$instCode}", $this->cacheTtl, function () use ($instCode): array {
            $data = $this->postToPortal($instCode);

            return collect($data)
                ->pluck('programName')
                ->filter(fn ($program) => filled($program))
                ->map(fn ($program) => trim((string) $program))
                ->unique()
                ->values()
                ->all();
        });
    }

    protected function postToPortal(string $instCode): ?array
    {
        if ($this->apiKey === '') {
            return null;
        }

        try {
            $response = Http::withHeaders([
                'PORTAL-API' => $this->apiKey,
                'Accept' => 'application/json',
                'Content-Type' => 'application/x-www-form-urlencoded',
            ])
                ->asForm()
                ->timeout($this->timeout)
                ->retry($this->retries, $this->backoff)
                ->post($this->baseUrl . $this->programsPath, [
                    'instCode' => $instCode,
                ]);

            if (! $response->ok()) {
                return null;
            }

            return $this->normalize($response->json());
        } catch (\Throwable $e) {
            report($e);

            return null;
        }
    }

    protected function normalize(mixed $data): ?array
    {
        if (is_string($data) && str_starts_with($data, 'Array[')) {
            $data = substr($data, 5);
            $data = json_decode($data, true);
        }

        return is_array($data) ? $data : null;
    }
}

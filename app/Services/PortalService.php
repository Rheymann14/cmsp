<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\PendingRequest;

class PortalService
{
    protected string $baseUrl = 'https://portal.chedro12.com/api';
    protected string $permitBaseUrl = '';
    protected string $programsPath = '/fetch-programs';
    protected string $allHeiPath = '/fetch-all-hei';

    protected int $timeout = 30;
    protected int $retries = 3;
    protected int $backoff = 500;
    protected int $cacheTtl = 600;

    protected string $apiKey = '';
    protected bool $verifySsl = true;

    public function __construct()
    {
        $this->apiKey = (string) config('services.portal.api_key', '');
        $this->baseUrl = rtrim((string) config('services.portal.base_url', $this->baseUrl), '/');
        $this->permitBaseUrl = rtrim((string) config('services.portal.permit_base_url', ''), '/');
        $this->verifySsl = (bool) config('services.portal.verify_ssl', true);
    }

    public function fetchAllHEI(): array
    {
        $cacheKey = 'portal_all_hei';

        if (Cache::has($cacheKey)) {
            $cached = Cache::get($cacheKey);

            return is_array($cached) ? $cached : [];
        }

        if ($this->apiKey === '') {
            return [];
        }

        try {
            $response = $this->portalRequest()
                ->get($this->baseUrl . $this->allHeiPath);

            if (! $response->ok()) {
                return [];
            }

            $data = $this->normalize($response->json());
            if ($data === null) {
                return [];
            }

            $items = collect($data)
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

            Cache::put($cacheKey, $items, $this->cacheTtl);

            return $items;
        } catch (\Throwable $e) {
            report($e);

            return [];
        }
    }

    public function fetchPrograms(string $instCode): array
    {
        $instCode = trim($instCode);
        if ($instCode === '') {
            return [];
        }

        $cacheKey = "portal_programs_{$instCode}";

        if (Cache::has($cacheKey)) {
            $cached = Cache::get($cacheKey);

            return is_array($cached) ? $cached : [];
        }

        $data = $this->postToPortal($instCode);
        if ($data === null) {
            return [];
        }

        $programs = collect($data)
            ->map(fn ($item) => [
                'programName' => isset($item['programName']) ? trim((string) $item['programName']) : null,
                'major' => isset($item['majorName']) ? trim((string) $item['majorName']) : (isset($item['major']) ? trim((string) $item['major']) : null),
                'program_status' => isset($item['program_status'])
                    ? trim((string) $item['program_status'])
                    : null,
                'status' => isset($item['status'])
                    ? (int) $item['status']
                    : (isset($item['status_program'])
                        ? (int) $item['status_program']
                        : null),
                'filename' => isset($item['filename']) ? trim((string) $item['filename']) : null,
                'document_type' => isset($item['document_type']) ? trim((string) $item['document_type']) : null,
                'date_uploaded' => isset($item['date_uploaded']) ? trim((string) $item['date_uploaded']) : null,
                'permit_url' => isset($item['filename']) && filled($item['filename']) && $this->permitBaseUrl !== ''
                    ? $this->permitBaseUrl . '/' . ltrim((string) $item['filename'], '/')
                    : null,
            ])
            ->filter(fn ($program) => filled($program['programName']))
            ->unique(fn ($program) => implode('|', [
                $program['programName'] ?? '',
                $program['major'] ?? '',
                strtolower((string) ($program['status'] ?? '')),
            ]))
            ->values()
            ->all();

        Cache::put($cacheKey, $programs, $this->cacheTtl);

        return $programs;
    }

    protected function postToPortal(string $instCode): ?array
    {
        if ($this->apiKey === '') {
            return null;
        }

        try {
            $response = $this->portalRequest()
                ->asForm()
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

    protected function portalRequest(): PendingRequest
    {
        return Http::withHeaders([
            'PORTAL-API' => $this->apiKey,
            'Accept' => 'application/json',
        ])
            ->withOptions([
                'verify' => $this->verifySsl,
            ])
            ->timeout($this->timeout)
            ->retry($this->retries, $this->backoff);
    }
}

<?php

namespace App\Http\Controllers;

use App\Services\PortalService;
use Inertia\Inertia;
use Inertia\Response;

class HeiProgramController extends Controller
{
    public function __construct(private readonly PortalService $portalService)
    {
    }

    public function index(): Response
    {
        return Inertia::render('hei_programs');
    }

    public function listHei(): \Illuminate\Http\JsonResponse
    {
        return response()->json([
            'items' => $this->portalService->fetchAllHEI(),
        ]);
    }

    public function listPrograms(string $instCode): \Illuminate\Http\JsonResponse
    {
        return response()->json([
            'programs' => $this->portalService->fetchPrograms($instCode),
        ]);
    }
}

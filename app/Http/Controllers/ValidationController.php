<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreValidationRequest;
use App\Models\CmspApplication;
use App\Models\Validation;
use App\Services\CmspEvaluationService;
use Illuminate\Http\JsonResponse;

class ValidationController extends Controller
{
    public function store(StoreValidationRequest $request, CmspEvaluationService $evaluationService): JsonResponse
    {
        $data = $request->validated();

        $application = CmspApplication::query()
            ->with(['school:id,name', 'courseModel:id,name'])
            ->findOrFail($data['cmsp_id']);

        $evaluation = $evaluationService->evaluate(
            $application,
            $data['disqualification_reasons'] ?? []
        );

        $validation = Validation::updateOrCreate(
            ['cmsp_id' => $application->id],
            [
                'cmsp_id' => $application->id,
                'tracking_no' => $application->tracking_no,
                'document_status' => $data['document_status'],
                'no_siblings' => $data['no_siblings'],
                'initial_rank' => $data['initial_rank'],
                'validator_notes' => $data['validator_notes'] ?? null,
                'remarks' => $evaluation['remarks'],
                'qualification_status' => $evaluation['qualification_status'],
                'disqualification_reasons' => $evaluation['remark_reasons'],
                'checked_by' => $request->user()->id,
            ]
        )->load('checker:id,name');

        return response()->json([
            'message' => 'Application validation saved successfully.',
            'validation' => $validation,
        ]);
    }

    public function destroy(Validation $validation): JsonResponse
    {
        $validation->delete();

        return response()->json([
            'message' => 'Application validation cleared.',
        ]);
    }
}

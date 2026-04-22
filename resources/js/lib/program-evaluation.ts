export type CourseOption = {
    id?: number;
    label: string;
};

export type HeiProgramItem = {
    programName: string;
    major?: string | null;
    status?: number | null;
    programStatus?: string | null;
    statusLabel?: string | null;
};

export const QUALIFIED_APPLICANT_REMARK = 'QUALIFIED APPLICANT';
export const DISQUALIFIED_REMARK = 'DISQUALIFIED';

export const normalizeText = (value: string): string =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();

const compactText = (value: string): string => normalizeText(value).replace(/\s+/g, '');

const stopWords = new Set(['bachelor', 'science', 'arts', 'in', 'of', 'and', 'the', 'major', 'related', 'fields', 'education']);

const extractAcronym = (value: string): string =>
    normalizeText(value)
        .split(' ')
        .filter((word) => word && !stopWords.has(word))
        .map((word) => word[0])
        .join('')
        .toUpperCase();

export const isProgramNameMatch = (programName: string, courseLabel: string): boolean => {
    const normalizedProgram = normalizeText(programName);
    const compactProgram = compactText(programName);
    const acronymProgram = extractAcronym(programName);
    const normalizedCourse = normalizeText(courseLabel);
    const compactCourse = compactText(courseLabel);
    const acronymCourse = extractAcronym(courseLabel);

    if (!normalizedProgram || !normalizedCourse) {
        return false;
    }

    return (
        normalizedProgram === normalizedCourse ||
        compactProgram === compactCourse ||
        normalizedProgram.includes(normalizedCourse) ||
        normalizedCourse.includes(normalizedProgram) ||
        (acronymProgram.length >= 3 && acronymProgram === acronymCourse) ||
        (acronymCourse.length >= 3 && compactProgram.includes(acronymCourse.toLowerCase()))
    );
};

export const isPriorityCourse = (programName: string, courses: CourseOption[]): boolean => {
    return courses.some((course) => isProgramNameMatch(programName, course.label));
};

export const isDiscontinuedProgram = (program: HeiProgramItem): boolean => {
    if (program.status === 0) return true;

    const normalizedStatuses = [program.programStatus, program.statusLabel]
        .map((value) =>
            String(value ?? '')
                .trim()
                .toLowerCase(),
        )
        .filter(Boolean);

    return normalizedStatuses.some(
        (value) => value === '0' || value === 'inactive' || value.includes('discontinued') || value.includes('inactive') || value.includes('closed'),
    );
};

export const normalizePriorityCourse = (item: unknown): CourseOption | null => {
    if (!item || typeof item !== 'object') {
        return null;
    }

    const raw = item as Record<string, unknown>;
    const id = Number(raw.id);
    const label = String(raw.label ?? raw.name ?? '').trim();

    if (!label) {
        return null;
    }

    return {
        id: Number.isFinite(id) ? id : undefined,
        label,
    };
};

export const normalizeHeiProgram = (item: unknown): HeiProgramItem | null => {
    if (typeof item === 'string') {
        const programName = item.trim();

        return programName
            ? {
                  programName,
                  major: null,
                  status: null,
                  programStatus: null,
                  statusLabel: null,
              }
            : null;
    }

    if (!item || typeof item !== 'object') {
        return null;
    }

    const raw = item as Record<string, unknown>;
    const programName = String(raw.programName ?? raw.program_name ?? '').trim();

    if (!programName) {
        return null;
    }

    const rawStatus = raw.status;
    const status = rawStatus === 0 || rawStatus === '0' ? 0 : rawStatus === 1 || rawStatus === '1' ? 1 : rawStatus == null ? null : Number(rawStatus);

    return {
        programName,
        major: raw.major ? String(raw.major).trim() : null,
        programStatus: raw.program_status ? String(raw.program_status).trim() : raw.programStatus ? String(raw.programStatus).trim() : null,
        statusLabel: raw.status_label ? String(raw.status_label).trim() : raw.programStatusLabel ? String(raw.programStatusLabel).trim() : null,
        status: Number.isFinite(status) ? status : null,
    };
};

export const isDocumentaryRequirementSatisfied = (documentStatus: string): boolean => {
    const normalized = normalizeText(documentStatus);

    if (!normalized) {
        return false;
    }

    const disqualifyingStatuses = ['incomplete', 'lacking', 'missing', 'pending', 'failed', 'fail', 'not complete', 'non compliant', 'deficient'];
    if (disqualifyingStatuses.some((status) => normalized.includes(status))) {
        return false;
    }

    const words = new Set(normalized.split(' ').filter(Boolean));

    return (
        words.has('complete') ||
        words.has('completed') ||
        words.has('complied') ||
        words.has('satisfied') ||
        words.has('passed') ||
        words.has('pass') ||
        words.has('ok') ||
        words.has('okay')
    );
};

export const getApplicationRemarks = ({
    documentStatus,
    selectedProgramName,
    priorityCourses,
    selectedHeiProgram = null,
    requiredValidationComplete = true,
    requiredValidationIssues = [],
    documentaryRequirementsSatisfied,
    documentaryRequirementIssues = [],
}: {
    documentStatus: string;
    selectedProgramName: string;
    priorityCourses: CourseOption[];
    selectedHeiProgram?: HeiProgramItem | null;
    requiredValidationComplete?: boolean;
    requiredValidationIssues?: string[];
    documentaryRequirementsSatisfied?: boolean;
    documentaryRequirementIssues?: string[];
}): string => {
    return getApplicationRemarksResult({
        documentStatus,
        selectedProgramName,
        priorityCourses,
        selectedHeiProgram,
        requiredValidationComplete,
        requiredValidationIssues,
        documentaryRequirementsSatisfied,
        documentaryRequirementIssues,
    }).remarks;
};

export const getApplicationRemarksResult = ({
    documentStatus,
    selectedProgramName,
    priorityCourses,
    selectedHeiProgram = null,
    requiredValidationComplete = true,
    requiredValidationIssues = [],
    documentaryRequirementsSatisfied,
    documentaryRequirementIssues = [],
}: {
    documentStatus: string;
    selectedProgramName: string;
    priorityCourses: CourseOption[];
    selectedHeiProgram?: HeiProgramItem | null;
    requiredValidationComplete?: boolean;
    requiredValidationIssues?: string[];
    documentaryRequirementsSatisfied?: boolean;
    documentaryRequirementIssues?: string[];
}): { remarks: string; reasons: string[] } => {
    const priorityProgramName = selectedHeiProgram?.programName || selectedProgramName;
    const isPriority = isPriorityCourse(priorityProgramName, priorityCourses);
    const isDiscontinued = selectedHeiProgram ? isDiscontinuedProgram(selectedHeiProgram) : false;
    const documentRequirementsSatisfied = documentaryRequirementsSatisfied ?? isDocumentaryRequirementSatisfied(documentStatus);
    const reasons: string[] = [];

    if (!requiredValidationComplete) {
        reasons.push(...(requiredValidationIssues.length > 0 ? requiredValidationIssues : ['Other required validation conditions are not met.']));
    }

    if (!documentRequirementsSatisfied) {
        reasons.push(
            ...(documentaryRequirementIssues.length > 0 ? documentaryRequirementIssues : ['Documentary/application requirements are not satisfied.']),
        );
    }

    if (!isPriority) {
        reasons.push('Selected program is not a priority course.');
    }

    if (isDiscontinued) {
        reasons.push('Selected program is discontinued/inactive.');
    }

    return reasons.length === 0 ? { remarks: QUALIFIED_APPLICANT_REMARK, reasons: [] } : { remarks: DISQUALIFIED_REMARK, reasons };
};

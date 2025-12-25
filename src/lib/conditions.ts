import { Condition, ResponseValue } from './types';

/**
 * Evaluate if a question should be shown based on its conditions
 * and the current responses
 */
export function shouldShowQuestion(
    conditions: Condition[] | undefined,
    responses: Record<string, ResponseValue['value']>
): boolean {
    // No conditions means always show
    if (!conditions || conditions.length === 0) {
        return true;
    }

    // All conditions must be met (AND logic)
    return conditions.every((condition) => {
        const responseValue = responses[condition.questionId];

        // If the referenced question hasn't been answered yet, hide this question
        if (responseValue === undefined || responseValue === null) {
            return false;
        }

        return evaluateCondition(condition, responseValue);
    });
}

/**
 * Evaluate a single condition against a response value
 */
function evaluateCondition(
    condition: Condition,
    responseValue: string | number | string[] | boolean
): boolean {
    const { operator, value } = condition;

    switch (operator) {
        case 'equals':
            if (Array.isArray(responseValue)) {
                return responseValue.includes(value as string);
            }
            return responseValue === value;

        case 'notEquals':
            if (Array.isArray(responseValue)) {
                return !responseValue.includes(value as string);
            }
            return responseValue !== value;

        case 'contains':
            if (Array.isArray(responseValue)) {
                return responseValue.includes(value as string);
            }
            if (typeof responseValue === 'string') {
                return responseValue.toLowerCase().includes((value as string).toLowerCase());
            }
            return false;

        case 'greaterThan':
            if (typeof responseValue === 'number') {
                return responseValue > (value as number);
            }
            return false;

        case 'lessThan':
            if (typeof responseValue === 'number') {
                return responseValue < (value as number);
            }
            return false;

        case 'in':
            if (Array.isArray(value)) {
                if (Array.isArray(responseValue)) {
                    return responseValue.some((rv) => value.includes(rv));
                }
                return value.includes(responseValue as string);
            }
            return false;

        case 'notIn':
            if (Array.isArray(value)) {
                if (Array.isArray(responseValue)) {
                    return !responseValue.some((rv) => value.includes(rv));
                }
                return !value.includes(responseValue as string);
            }
            return true;

        default:
            return true;
    }
}

/**
 * Filter questions based on role and conditions
 */
export function filterQuestionsForRole(
    questions: { role: string; conditions?: Condition[] }[],
    role: 'nurse' | 'doctor',
    responses: Record<string, ResponseValue['value']>
): number[] {
    const visibleIndices: number[] = [];

    questions.forEach((question, index) => {
        // Check role
        if (question.role !== 'both' && question.role !== role) {
            return;
        }

        // Check conditions
        if (!shouldShowQuestion(question.conditions, responses)) {
            return;
        }

        visibleIndices.push(index);
    });

    return visibleIndices;
}

/**
 * Get progress information for the survey
 */
export function getSurveyProgress(
    currentIndex: number,
    totalVisible: number,
    sections: { name: string; startIndex: number }[]
): {
    overallProgress: number;
    currentSection: string;
    sectionProgress: number;
    questionsInSection: { current: number; total: number };
} {
    const overallProgress = totalVisible > 0 ? (currentIndex / totalVisible) * 100 : 0;

    // Find current section
    let currentSection = sections[0]?.name || 'Survey';
    let sectionStartIndex = 0;
    let sectionEndIndex = totalVisible;

    for (let i = 0; i < sections.length; i++) {
        if (currentIndex >= sections[i].startIndex) {
            currentSection = sections[i].name;
            sectionStartIndex = sections[i].startIndex;
            sectionEndIndex = sections[i + 1]?.startIndex || totalVisible;
        }
    }

    const questionsInSection = sectionEndIndex - sectionStartIndex;
    const currentInSection = currentIndex - sectionStartIndex;
    const sectionProgress = questionsInSection > 0
        ? (currentInSection / questionsInSection) * 100
        : 0;

    return {
        overallProgress,
        currentSection,
        sectionProgress,
        questionsInSection: {
            current: currentInSection + 1,
            total: questionsInSection,
        },
    };
}

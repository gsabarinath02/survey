// ============================================
// Type Definitions for AI Nurse Copilot Survey
// ============================================

export type Role = 'nurse' | 'doctor';

export type QuestionType =
    | 'choice'        // Single choice
    | 'multi-choice'  // Multiple choice
    | 'text'          // Short text input
    | 'textarea'      // Long text input
    | 'slider'        // Numeric slider
    | 'boolean'       // Yes/No
    | 'likert'        // Likert scale (1-5)
    | 'ranking'       // Rank items in order
    | 'info';         // Information/consent block

export interface Condition {
    questionId: string;
    operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'in' | 'notIn';
    value: string | number | string[] | boolean;
}

export interface QuestionConfig {
    min?: number;
    max?: number;
    step?: number;
    labels?: Record<number, string>;
    likertLabels?: {
        low: string;
        high: string;
    };
    placeholder?: string;
    maxSelections?: number;
    rankCount?: number;  // For ranking: how many to rank
}

export interface Question {
    id: string;
    externalId: string;
    role: Role | 'both';
    section: string;
    sectionOrder: number;
    order: number;
    text: string;
    subText?: string;
    type: QuestionType;
    options?: string[];
    required: boolean;
    isActive: boolean;
    conditions?: Condition[];
    config?: QuestionConfig;
}

// For the frontend, a simplified version used during survey
export interface SurveyQuestion {
    id: string;
    section: string;
    sectionOrder: number;
    text: string;
    subText?: string;
    type: QuestionType;
    options?: string[];
    required: boolean;
    config?: QuestionConfig;
}

export interface SurveySession {
    id: string;
    role: Role;
    startedAt: Date;
    completedAt?: Date;
}

export interface ResponseValue {
    questionId: string;
    value: string | number | string[] | boolean | null;
}

// API Request/Response types
export interface CreateSessionRequest {
    role: Role;
    deviceInfo?: string;
}

export interface CreateSessionResponse {
    sessionId: string;
    questions: SurveyQuestion[];
}

export interface SubmitResponseRequest {
    sessionId: string;
    questionId: string;
    value: string | number | string[] | boolean | null;
}

export interface CompleteSessionRequest {
    sessionId: string;
}

// Admin types
export interface QuestionCreateInput {
    externalId: string;
    role: Role | 'both';
    section: string;
    sectionOrder: number;
    order: number;
    text: string;
    subText?: string;
    type: QuestionType;
    options?: string[];
    required: boolean;
    conditions?: Condition[];
    config?: QuestionConfig;
}

export interface QuestionUpdateInput extends Partial<QuestionCreateInput> {
    isActive?: boolean;
}

// Analytics types
export interface AnalyticsSummary {
    totalSessions: number;
    completedSessions: number;
    nurseSessions: number;
    doctorSessions: number;
    averageCompletionTimeMinutes: number;
    responsesBySection: Record<string, number>;
}

export interface QuestionAnalytics {
    questionId: string;
    questionText: string;
    responseCount: number;
    distribution?: Record<string, number>;  // For choice questions
    averageValue?: number;  // For numeric/likert
    textResponses?: string[];  // For text questions
}

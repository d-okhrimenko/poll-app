export type Role = 'admin' | 'user';

export interface User {
    id: string;
    email: string;
    passwordHash: string;
    role: Role;
    createdAt: string;
}

export interface SurveyOption {
    id: string;
    text: string;
}

export interface Survey {
    id: string;
    question: string;
    options: SurveyOption[];
    publicId: string;
    createdByUserId: string;
    createdAt: string;
}

export interface Vote {
    id: string;
    surveyId: string;
    userId: string;
    optionId: string;
    createdAt: string;
}

export interface DatabaseSchema {
    users: User[];
    surveys: Survey[];
    votes: Vote[];
}

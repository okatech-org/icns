export interface MinisterialProject {
    id: string;
    ministry: string;
    project_name: string;
    status: "en_cours" | "termine" | "bloque";
    progress: number;
    deadline: string;
    priority: "haute" | "moyenne" | "basse";
    created_at: string;
}

export interface PresidentialInstruction {
    id: string;
    instruction: string;
    assigned_to: string;
    status: "pending" | "in_progress" | "completed";
    due_date: string;
    priority: "critical" | "high" | "normal";
    created_at: string;
}

export interface InterministerialCoordination {
    id: string;
    subject: string;
    ministries_involved: string[];
    status: "planned" | "ongoing" | "completed";
    meeting_date?: string;
    notes?: string;
    created_at: string;
}

export interface CouncilPreparation {
    id: string;
    meeting_date: string;
    agenda_items: string[];
    status: "draft" | "finalized" | "archived";
    documents_url?: string[];
    created_at: string;
}

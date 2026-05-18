export interface IntelligenceReport {
    id: string;
    title: string;
    content: string;
    source: string;
    classification: "secret" | "top_secret" | "confidential" | "restricted";
    status: "draft" | "submitted" | "reviewed" | "archived";
    created_at: string;
}

export interface SurveillanceTarget {
    id: string;
    name: string;
    type: "individual" | "organization" | "location" | "cyber";
    status: "active" | "inactive" | "under_review" | "neutralized";
    priority: "critical" | "high" | "medium" | "low";
    last_update: string;
    created_at: string;
}

export interface ThreatIndicator {
    id: string;
    type: "terrorism" | "espionage" | "cyber" | "civil_unrest" | "economic";
    level: "critical" | "high" | "elevated" | "guarded" | "low";
    description: string;
    location?: string;
    timestamp: string;
    created_at: string;
}

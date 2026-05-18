export interface OfficialDecree {
    id: string;
    title: string;
    reference_number: string;
    status: "draft" | "pending_signature" | "signed" | "published";
    signature_date?: string;
    publication_date?: string;
    type: "decree" | "order" | "decision" | "circular";
    created_at: string;
}

export interface LegalReview {
    id: string;
    document_title: string;
    requestor: string;
    priority: "high" | "medium" | "low";
    status: "pending" | "in_review" | "completed";
    assigned_to?: string;
    due_date?: string;
    created_at: string;
}

export interface AdministrativeArchive {
    id: string;
    title: string;
    category: string;
    reference_code: string;
    archiving_date: string;
    access_level: "public" | "restricted" | "confidential" | "secret";
    created_at: string;
}

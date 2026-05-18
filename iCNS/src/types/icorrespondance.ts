// Types iCorrespondance

export type ICorrStatus =
    | "DRAFT"
    | "PENDING_APPROVAL"
    | "APPROVED"
    | "REJECTED"
    | "READY_FOR_DELIVERY"
    | "DELIVERED"
    | "SENT"
    | "ARCHIVED";

export type ICorrDeliveryMethod = "PRINT" | "EMAIL" | "PENDING";

export type ICorrStepType =
    | "CREATED"
    | "SENT_FOR_APPROVAL"
    | "VIEWED"
    | "APPROVED"
    | "REJECTED"
    | "MODIFICATION_REQUESTED"
    | "RETURNED_TO_AGENT"
    | "READY_FOR_DELIVERY"
    | "DELIVERED_PRINT"
    | "DELIVERED_EMAIL"
    | "ARCHIVED";

export interface ICorrFolder {
    id: string;
    user_id: string;
    organization_id: string | null;
    name: string;
    reference_number: string | null;
    recipient_name: string | null;
    recipient_organization: string | null;
    recipient_email: string | null;
    recipient_user_id: string | null;
    comment: string | null;
    correspondence_type: string | null;
    status: ICorrStatus;
    is_urgent: boolean;
    is_internal: boolean;
    is_read: boolean;
    current_holder_id: string | null;
    requires_approval: boolean;
    approved_by_id: string | null;
    approved_at: string | null;
    rejection_reason: string | null;
    delivery_method: ICorrDeliveryMethod | null;
    delivered_at: string | null;
    sent_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ICorrFolderWithDocs extends ICorrFolder {
    documents?: ICorrDocument[];
}

export interface ICorrDocument {
    id: string;
    folder_id: string;
    name: string;
    storage_path: string | null;
    file_url: string | null;
    file_type: string | null;
    file_size: number | null;
    mime_type: string | null;
    content_hash: string | null;
    is_generated: boolean;
    generator_type: string | null;
    created_at: string;
}

export interface ICorrWorkflowStep {
    id: string;
    folder_id: string;
    step_type: ICorrStepType;
    actor_id: string | null;
    actor_name: string | null;
    actor_role: string | null;
    target_id: string | null;
    target_name: string | null;
    comment: string | null;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
}

export interface CreateICorrFolderInput {
    name: string;
    recipient_name?: string;
    recipient_organization?: string;
    recipient_email?: string;
    recipient_user_id?: string | null;
    comment?: string;
    correspondence_type?: string;
    is_urgent?: boolean;
    is_internal?: boolean;
    requires_approval?: boolean;
}

export interface ICorrStats {
    total: number;
    drafts: number;
    pending_approval: number;
    approved: number;
    sent: number;
    urgent: number;
}

// Liste des types de correspondance disponibles dans le SI executif
export const CORRESPONDENCE_TYPES = [
    { code: "lettre", label: "Lettre officielle" },
    { code: "rapport", label: "Rapport" },
    { code: "note", label: "Note de service" },
    { code: "decret", label: "Decret" },
    { code: "arrete", label: "Arrete" },
    { code: "convention", label: "Convention" },
    { code: "compte-rendu", label: "Compte-rendu" },
    { code: "discours", label: "Discours" },
    { code: "communique", label: "Communique" },
    { code: "instruction", label: "Instruction" },
] as const;

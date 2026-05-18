// Types iArchive

export type IArchStatus = "active" | "semi_active" | "archived" | "expired" | "destroyed";
export type IArchSourceType = "manual_upload" | "document_archive" | "folder_archive";
export type IArchCertStatus = "valid" | "revoked";
export type IArchDestructionMethod = "legal_expiry" | "manual_request" | "compliance";

export interface IArchCategory {
    id: string;
    organization_id: string | null;
    name: string;
    slug: string;
    description: string | null;
    color: string | null;
    icon: string | null;
    retention_years: number | null;
    ohada_reference: string | null;
    counting_start_event: string;
    has_semi_active_phase: boolean;
    active_duration_years: number | null;
    semi_active_duration_years: number | null;
    is_perpetual: boolean;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface IArchArchive {
    id: string;
    title: string;
    description: string | null;
    category_id: string | null;
    category_slug: string | null;
    organization_id: string | null;
    uploaded_by: string;
    source_document_id: string | null;
    source_folder_id: string | null;
    source_type: IArchSourceType | null;
    storage_path: string | null;
    file_url: string | null;
    file_name: string | null;
    file_size: number | null;
    mime_type: string | null;
    sha256_hash: string | null;
    retention_years: number | null;
    retention_expires_at: string | null;
    counting_start_date: string | null;
    active_until: string | null;
    semi_active_until: string | null;
    original_creation_date: string | null;
    status: IArchStatus;
    is_vault: boolean;
    legal_hold_applied_at: string | null;
    legal_hold_reason: string | null;
    archived_at: string;
    archived_by: string;
    created_at: string;
    updated_at: string;
}

export interface IArchArchiveWithRelations extends IArchArchive {
    category?: IArchCategory | null;
}

export interface IArchCertificate {
    id: string;
    archive_id: string;
    certificate_number: string;
    sha256_hash: string | null;
    issued_at: string;
    issued_by: string;
    valid_until: string | null;
    status: IArchCertStatus;
    revoked_at: string | null;
    revoked_by: string | null;
    revoked_reason: string | null;
}

export interface IArchDestructionCertificate {
    id: string;
    certificate_number: string;
    archive_id: string;
    organization_id: string | null;
    document_title: string;
    document_category: string | null;
    document_category_slug: string | null;
    original_file_name: string | null;
    original_file_size: number | null;
    original_mime_type: string | null;
    original_sha256_hash: string | null;
    original_archived_at: string | null;
    retention_years: number | null;
    retention_expires_at: string | null;
    ohada_reference: string | null;
    destroyed_at: string;
    destroyed_by: string;
    destruction_reason: string | null;
    destruction_method: IArchDestructionMethod;
    approved_by: string | null;
    approved_at: string | null;
    status: "issued" | "voided";
    issued_at: string;
}

export interface CreateArchiveInput {
    title: string;
    description?: string;
    category_id: string;
    source_document_id?: string | null;
    source_folder_id?: string | null;
    source_type?: IArchSourceType;
    storage_path?: string;
    file_url?: string;
    file_name?: string;
    file_size?: number;
    mime_type?: string;
    sha256_hash?: string;
    original_creation_date?: string;
    counting_start_date?: string;
}

export interface IArchStats {
    total: number;
    active: number;
    semi_active: number;
    archived: number;
    expired: number;
    destroyed: number;
    expiring_soon: number;
    vault: number;
}

export interface VisitorLog {
    id: string;
    visitor_name: string;
    organization?: string;
    purpose: string;
    host_name: string;
    check_in_time: string;
    check_out_time?: string;
    status: "checked_in" | "checked_out" | "expected";
    badge_number?: string;
    created_at: string;
}

export interface AccreditationRequest {
    id: string;
    applicant_name: string;
    organization: string;
    type: "press" | "diplomatic" | "staff" | "contractor";
    status: "pending" | "approved" | "rejected" | "revoked";
    valid_until?: string;
    created_at: string;
}

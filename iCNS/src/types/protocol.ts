export interface OfficialEvent {
    id: string;
    title: string;
    date: string;
    location: string;
    type: "ceremony" | "meeting" | "visit" | "gala";
    status: "upcoming" | "ongoing" | "completed" | "cancelled";
    description?: string;
    created_at: string;
}

export interface Guest {
    id: string;
    event_id: string;
    name: string;
    title?: string;
    organization?: string;
    status: "invited" | "confirmed" | "declined" | "attended";
    category: "vip" | "press" | "staff" | "general";
    created_at: string;
}

export interface ProtocolProcedure {
    id: string;
    title: string;
    description: string;
    category: "ceremonial" | "diplomatic" | "security" | "logistics";
    created_at: string;
}

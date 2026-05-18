export type ConfidentialityLevel = 'confidentiel' | 'tres_confidentiel' | 'secret';
export type AudienceStatus = 'scheduled' | 'completed' | 'cancelled' | 'postponed';
export type MessagePriority = 'normal' | 'high' | 'critical';
export type CorrespondenceType = 'lettre' | 'email' | 'invitation' | 'autre';
export type CorrespondenceStatus = 'recu' | 'en_traitement' | 'traite' | 'archive';
export type TripType = 'prive' | 'vacances' | 'famille' | 'medical';
export type ContactCategory = 'chef_etat' | 'diplomate' | 'politique' | 'famille' | 'prive' | 'autre';

export interface PrivateAudience {
    id: string;
    person_name: string;
    person_title?: string;
    subject: string;
    date: string; // ISO string
    location?: string;
    confidentiality_level: ConfidentialityLevel;
    status: AudienceStatus;
    notes?: string;
    created_at: string;
    created_by?: string;
}

export type SecurityLevel = 'standard' | 'enhanced' | 'maximum';

export interface EncryptedMessage {
    id: string;
    sender_id: string;
    sender_name?: string;
    recipient_id: string;
    subject: string;
    content: string;
    is_read: boolean;
    priority: MessagePriority;
    security_level: SecurityLevel;
    encryption_key?: string;
    created_at: string;
}

export type CorrespondencePriority = 'basse' | 'moyenne' | 'haute';

export interface PersonalCorrespondence {
    id: string;
    sender_name: string;
    subject: string;
    content?: string;
    received_date: string;
    type: CorrespondenceType;
    priority: CorrespondencePriority;
    status: CorrespondenceStatus;
    deadline?: string;
    created_at: string;
}

export interface VIPContact {
    id: string;
    name: string;
    title?: string;
    organization?: string;
    country?: string;
    category: ContactCategory;
    email?: string;
    phone?: string;
    notes?: string;
    is_favorite: boolean;
    created_at: string;
}

export type TripStatus = 'planned' | 'confirmed' | 'cancelled' | 'completed';

export interface PrivateTrip {
    id: string;
    destination: string;
    start_date: string;
    end_date: string;
    purpose: string;
    type: TripType;
    status: TripStatus;
    participants?: string[];
    notes?: string;
    created_at: string;
}

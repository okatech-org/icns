export type MailType = 'lettre' | 'colis' | 'facture' | 'invitation' | 'autre';
export type MailUrgency = 'faible' | 'normale' | 'haute' | 'urgente';
export type MailStatus = 'recu' | 'en_traitement' | 'distribue' | 'archive';

export interface IncomingMail {
    id: string;
    reference_number: string;
    sender: string;
    subject: string;
    received_date: string;
    type: MailType;
    urgency: MailUrgency;
    status: MailStatus;
    assigned_to?: string;
    digital_copy_url?: string;
    notes?: string;
    created_at: string;
    updated_at: string;
}

export interface MailStats {
    totalToday: number;
    urgentPending: number;
    toProcess: number;
    processedToday: number;
}

import { supabase } from "@/integrations/supabase/client";

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  details?: any;
  ip_address?: string;
  severity: "info" | "warning" | "error" | "critical";
  success: boolean;
  duration_ms?: number;
  user_agent?: string;
  created_at: string;
}

export interface AuditLogFilters {
  severity?: string;
  success?: boolean;
  resource?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export class AuditLogService {
  async getLogs(filters: AuditLogFilters = {}): Promise<AuditLog[]> {
    let query = supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (filters.severity) {
      query = query.eq("severity", filters.severity);
    }
    if (filters.success !== undefined) {
      query = query.eq("success", filters.success);
    }
    if (filters.resource) {
      query = query.eq("resource", filters.resource);
    }
    if (filters.action) {
      query = query.eq("action", filters.action);
    }
    if (filters.startDate) {
      query = query.gte("created_at", filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte("created_at", filters.endDate);
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as AuditLog[];
  }

  async logEvent(
    action: string,
    resource: string,
    details?: any,
    severity: "info" | "warning" | "error" | "critical" = "info",
    success: boolean = true
  ): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase.rpc("log_audit_event", {
      p_user_id: user.id,
      p_action: action,
      p_resource: resource,
      p_details: details || {},
      p_severity: severity,
      p_success: success,
    });

    if (error) throw error;
  }

  async getLogStats(): Promise<{
    total: number;
    byLevel: Record<string, number>;
    byResource: Record<string, number>;
  }> {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("severity, resource");

    if (error) throw error;

    const byLevel: Record<string, number> = {};
    const byResource: Record<string, number> = {};

    data?.forEach((log) => {
      byLevel[log.severity] = (byLevel[log.severity] || 0) + 1;
      byResource[log.resource] = (byResource[log.resource] || 0) + 1;
    });

    return {
      total: data?.length || 0,
      byLevel,
      byResource,
    };
  }
}

export const auditLogService = new AuditLogService();

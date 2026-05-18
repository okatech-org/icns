import { supabase } from '@/integrations/supabase/client';
import type { IntelligenceReport, SurveillanceTarget, ThreatIndicator } from '@/types/dgss';

export const dgssService = {
  // Intelligence Reports
  async getIntelligenceReports() {
    const { data, error } = await supabase
      .from('intelligence_reports')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as IntelligenceReport[];
  },

  async createIntelligenceReport(report: Omit<IntelligenceReport, 'id' | 'created_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('intelligence_reports')
      .insert({
        ...report,
        created_by: user.id,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as IntelligenceReport;
  },

  async updateIntelligenceReport(id: string, updates: Partial<IntelligenceReport>) {
    const { data, error } = await supabase
      .from('intelligence_reports')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as IntelligenceReport;
  },

  async deleteIntelligenceReport(id: string) {
    const { error } = await supabase
      .from('intelligence_reports')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Surveillance Targets
  async getSurveillanceTargets() {
    const { data, error } = await supabase
      .from('surveillance_targets')
      .select('*')
      .order('last_update', { ascending: false });
    
    if (error) throw error;
    return data as SurveillanceTarget[];
  },

  async createSurveillanceTarget(target: Omit<SurveillanceTarget, 'id' | 'created_at' | 'last_update'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('surveillance_targets')
      .insert({
        ...target,
        created_by: user.id,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as SurveillanceTarget;
  },

  async updateSurveillanceTarget(id: string, updates: Partial<SurveillanceTarget>) {
    const { data, error } = await supabase
      .from('surveillance_targets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as SurveillanceTarget;
  },

  async deleteSurveillanceTarget(id: string) {
    const { error } = await supabase
      .from('surveillance_targets')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Threat Indicators
  async getThreatIndicators() {
    const { data, error } = await supabase
      .from('threat_indicators')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    return data as ThreatIndicator[];
  },

  async createThreatIndicator(threat: Omit<ThreatIndicator, 'id' | 'created_at'>) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('threat_indicators')
      .insert({
        ...threat,
        created_by: user.id,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data as ThreatIndicator;
  },

  async updateThreatIndicator(id: string, updates: Partial<ThreatIndicator>) {
    const { data, error } = await supabase
      .from('threat_indicators')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as ThreatIndicator;
  },

  async deleteThreatIndicator(id: string) {
    const { error } = await supabase
      .from('threat_indicators')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Statistics
  async getDgssStats() {
    const [reports, targets, threats] = await Promise.all([
      this.getIntelligenceReports(),
      this.getSurveillanceTargets(),
      this.getThreatIndicators(),
    ]);

    return {
      totalReports: reports.length,
      pendingReports: reports.filter(r => r.status === 'draft' || r.status === 'submitted').length,
      activeTargets: targets.filter(t => t.status === 'active').length,
      criticalTargets: targets.filter(t => t.priority === 'critical' || t.priority === 'high').length,
      activeThreats: threats.filter(t => t.level === 'critical' || t.level === 'high').length,
      recentThreats: threats.slice(0, 10),
    };
  },
};

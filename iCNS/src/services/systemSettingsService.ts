import { supabase } from "@/integrations/supabase/client";

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  setting_type: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export class SystemSettingsService {
  async getAllSettings(): Promise<SystemSetting[]> {
    const { data, error } = await supabase
      .from("system_settings")
      .select("*")
      .order("setting_type", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async getSetting(key: string): Promise<SystemSetting | null> {
    const { data, error } = await supabase
      .from("system_settings")
      .select("*")
      .eq("setting_key", key)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data;
  }

  async updateSetting(
    key: string,
    value: any,
    updatedBy?: string
  ): Promise<SystemSetting> {
    const { data, error } = await supabase
      .from("system_settings")
      .update({
        setting_value: value,
        updated_by: updatedBy,
      })
      .eq("setting_key", key)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async createSetting(
    setting: Omit<SystemSetting, "id" | "created_at" | "updated_at">
  ): Promise<SystemSetting> {
    const { data, error } = await supabase
      .from("system_settings")
      .insert(setting)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteSetting(key: string): Promise<void> {
    const { error } = await supabase
      .from("system_settings")
      .delete()
      .eq("setting_key", key);

    if (error) throw error;
  }
}

export const systemSettingsService = new SystemSettingsService();

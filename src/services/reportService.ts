import { supabase } from '@/integrations/supabase/client';

export interface ContentReport {
  id: string;
  user_id: string;
  user_email?: string;
  content_id: string;
  content_type: string;
  content_title: string;
  report_type: string;
  message?: string;
  status: string;
  created_at: string;
}

export const reportService = {
  async submitReport(report: {
    content_id: string;
    content_type: string;
    content_title: string;
    report_type: string;
    message?: string;
  }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    const { error } = await supabase
      .from('content_reports')
      .insert({
        user_id: user.id,
        user_email: user.email,
        content_id: report.content_id,
        content_type: report.content_type,
        content_title: report.content_title,
        report_type: report.report_type,
        message: report.message,
      });

    if (error) throw error;
  },

  async getReports(): Promise<ContentReport[]> {
    const { data, error } = await supabase
      .from('content_reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateReportStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('content_reports')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  }
};

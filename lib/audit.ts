import { createClient } from '@/lib/supabase/server'

type AuditAction =
  | 'reservation.update_status'
  | 'reservation.assign_staff'
  | 'reservation.update_admin_note'
  | 'staff.update'
  | 'staff.delete'
  | 'bar.create'
  | 'bar.update'
  | 'bar.delete'
  | 'flavor.create'
  | 'flavor.update'
  | 'flavor.delete'
  | 'recipient.create'
  | 'recipient.create_from_line'
  | 'recipient.update'
  | 'recipient.delete'

export async function audit(
  action: AuditAction,
  resource: { type: string; id?: string | null },
  payload?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      actor_email: user.email ?? null,
      action,
      resource_type: resource.type,
      resource_id: resource.id ?? null,
      payload: payload ?? null,
    })
  } catch (e) {
    // 監査ログの失敗で本処理を止めない
    console.error('[audit] failed:', e)
  }
}

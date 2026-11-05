// Словарь событий — один к одному с docs/product/04-metrics-and-events.md §3 (единственный источник).
// Событие, которого нет здесь, не компилируется. Сверка с документом: `pnpm check:events`.
// Свойства — только string | number | boolean | enum | string[]; PII не передаём никогда (§2.3).

import type { ClientStatus, DocumentStatus, LimitStatus, SupplierStatus, SupplierViewStatus } from '@/shared/api';

import type { ScreenId } from '@/shared/config';

import type { AmountBucket, CountBucket, UsedShareBucket } from './buckets';

/** screen_id из 01-cabinet-structure.md §1 — источник в shared/config/routes.ts. */
export type { ScreenId };

export type RoleFamilyProp = 'client' | 'supplier';
export type Owner = 'client' | 'supplier';
/** Ключ карточки «следующий шаг» (`next_step.*`). */
export type NextStepKey = `next_step.${string}`;
export type ChecklistItemKey = 'spa_sadq' | 'pn_company_nafith' | 'pn_owner_nafith';
type MaterialLang = 'ar' | 'en' | 'both';
type ReferralSource = 'home' | 'referral';

// ---------- §3.6 Контекст screen_viewed по экранам ----------

export type ScreenViewedProps =
  | {
      screen_id: 'client.home';
      status: ClientStatus;
      round?: number;
      requested_count?: number;
      has_eta?: boolean;
      hours_since_submit?: number;
      limit_status?: LimitStatus;
      checklist_done_count?: number;
      used_share_bucket?: UsedShareBucket;
    }
  | { screen_id: 'client.documents'; portal_key?: string; locked: boolean; round: number }
  | { screen_id: 'client.document'; portal_key?: string; locked: boolean; round: number }
  | { screen_id: 'client.closed'; had_limit: boolean }
  | { screen_id: 'client.reapply' }
  | { screen_id: 'supplier.home'; supplier_status: SupplierStatus; referred_bucket: CountBucket }
  | { screen_id: 'supplier.referral'; supplier_status: SupplierStatus }
  | { screen_id: 'supplier.documents'; uploaded: number; total: number; has_rejected: boolean }
  | { screen_id: 'supplier.document'; uploaded: number; total: number; has_rejected: boolean }
  | { screen_id: 'supplier.clients'; total_bucket: CountBucket; by_status: Record<SupplierViewStatus, number> }
  | { screen_id: 'supplier.offer'; tab: 'terms' | 'materials' }
  | { screen_id: 'auth.phone' }
  | { screen_id: 'auth.otp' }
  | { screen_id: 'auth.not_found' }
  | { screen_id: 'auth.expired' }
  | { screen_id: 'client.help' }
  | { screen_id: 'supplier.help' }
  | { screen_id: 'system.404'; path_hash: string };

// ---------- §3 Словарь ----------

export type AnalyticsEvent =
  // §3.1 Вход, сессия, оболочка
  | { name: 'app_loaded'; props: { cold_start: boolean; sw_state: 'none' | 'installed' | 'updated' } }
  | { name: 'auth_otp_requested'; props: { channel: 'sms' | 'whatsapp'; resend: boolean; source: 'whatsapp_link' | 'landing' | 'direct' } }
  | {
      name: 'auth_otp_failed';
      props: { reason: 'invalid' | 'expired' | 'too_many_attempts' | 'rate_limited' | 'phone_unknown' | 'server_error'; attempt?: number };
    }
  | {
      name: 'auth_login_succeeded';
      props: { role_count: 1 | 2; active_role: RoleFamilyProp; returned_to: boolean; first_login: boolean; from_landing: boolean };
    }
  | { name: 'auth_multiple_applications_detected'; props: { count: number } }
  | { name: 'session_expired'; props: { last_screen_id: ScreenId } }
  | { name: 'logout'; props: { offline: boolean } }
  | { name: 'role_switched'; props: { from: RoleFamilyProp; to: RoleFamilyProp } }
  | { name: 'role_hint_shown'; props: Record<string, never> }
  | { name: 'role_hint_dismissed'; props: Record<string, never> }
  | { name: 'language_changed'; props: { to: 'ar' | 'en'; source: 'switch' | 'url' } }
  | { name: 'theme_changed'; props: { to: 'system' | 'light' | 'dark' } }
  | {
      name: 'support_contact_clicked';
      props: { channel: 'whatsapp' | 'email'; status?: ClientStatus | SupplierStatus; context?: 'closed' | 'under_review' | 'auth' | 'error' };
    }
  | { name: 'network_offline'; props: { offline_seconds?: number } }
  | { name: 'network_restored'; props: { offline_seconds?: number } }
  | { name: 'storage_unavailable'; props: Record<string, never> }
  // platform и in_iab — из общего контекста §2.2.
  | { name: 'pwa_install_prompted'; props: Record<string, never> }
  | { name: 'pwa_installed'; props: Record<string, never> }
  | { name: 'pwa_update_prompted'; props: { from_version: string; to_version: string } }
  | { name: 'screen_viewed'; props: ScreenViewedProps }
  | { name: 'next_step_cta_clicked'; props: { step: NextStepKey } }
  | {
      name: 'data_inconsistency';
      props: { kind: 'empty_round' | 'used_exceeds_approved' | 'counters_mismatch' | 'missing_slug' | (string & {}) };
    }
  // §3.2 Документы — у всех событий раздела есть owner
  | {
      name: 'document_upload_started';
      props: { owner: Owner; portal_key: string; size_kb: number; mime: 'pdf' | 'jpg' | 'png'; source: 'camera' | 'gallery' | 'files' | 'unknown' };
    }
  | {
      name: 'document_upload_succeeded';
      props: { owner: Owner; portal_key: string; prevalidation: 'passed' | 'warning'; replace: boolean; file_index: number; duration_ms: number };
    }
  | {
      name: 'document_upload_failed';
      props: {
        owner: Owner;
        portal_key: string;
        reason: 'too_large' | 'unsupported_type' | 'network' | 'offline' | 'server_error' | 'cancelled' | 'same_file_rejected';
      };
    }
  | { name: 'document_prevalidation_failed'; props: { owner: Owner; portal_key: string; rule_key: string } }
  | { name: 'document_file_deleted'; props: { owner: Owner; portal_key: string } }
  | { name: 'document_file_downloaded'; props: { owner: Owner; portal_key: string; status: DocumentStatus } }
  | { name: 'document_example_opened'; props: { owner: Owner; portal_key: string } }
  | { name: 'document_video_opened'; props: { owner: Owner; portal_key: string; lang_video: 'ar' } }
  | {
      name: 'document_set_submitted';
      props: { owner: Owner; documents_count: number; optional_uploaded: boolean; auto: boolean; round: number; duration_from_first_upload_min: number };
    }
  | { name: 'documents_viewed_locked'; props: { owner: Owner; documents_count: number } }
  | {
      name: 'rejected_document_viewed';
      props: { owner: Owner; portal_key: string; has_reason: boolean; reason_key?: string; reason_lang_missing?: 'en'; source: 'home' | 'list' | 'banner' };
    }
  | { name: 'rejected_document_reuploaded'; props: { owner: Owner; portal_key: string; attempt: number; reason_key?: string; hours_since_rejection: number } }
  | { name: 'more_docs_banner_viewed'; props: { owner: Owner; round: number; requested_count: number; repeated_count: number } }
  | { name: 'previous_round_expanded'; props: { owner: Owner; round: number } }
  | { name: 'document_added_by_odoo'; props: { owner: Owner; portal_key: string } }
  // §3.3 Статус, проверка, лимит
  | { name: 'status_changed_while_open'; props: { from: ClientStatus; to: ClientStatus } }
  | { name: 'status_change_banner_viewed'; props: { from: ClientStatus; to: ClientStatus } }
  | { name: 'status_change_banner_dismissed'; props: { from: ClientStatus; to: ClientStatus } }
  | { name: 'review_overdue_viewed'; props: { hours_over: number } }
  | { name: 'checklist_link_opened'; props: { item: ChecklistItemKey; position: number } }
  | { name: 'checklist_item_completed'; props: { item: ChecklistItemKey; hours_since_ready: number } }
  | { name: 'checklist_item_failed_viewed'; props: { item: ChecklistItemKey } }
  | { name: 'checklist_item_stale'; props: { item: ChecklistItemKey; hours: number } }
  | { name: 'external_link_blocked'; props: { item?: string; href_host: string } }
  | { name: 'limit_activated'; props: { days_since_approved: number; amount_bucket: AmountBucket } }
  | { name: 'limit_cancelled_viewed'; props: Record<string, never> }
  | { name: 'limit_fully_used_viewed'; props: Record<string, never> }
  | { name: 'how_to_buy_viewed'; props: Record<string, never> }
  | { name: 'how_to_buy_whatsapp_clicked'; props: { used_share_bucket: UsedShareBucket } }
  | { name: 'closed_reapply_clicked'; props: Record<string, never> }
  | { name: 'reapply_submitted'; props: Record<string, never> }
  | { name: 'reapply_pending_viewed'; props: Record<string, never> }
  | { name: 'returning_redirected_to_cabinet'; props: { status: ClientStatus } }
  // §3.4 Поставщик: главная, ссылка, клиенты
  | { name: 'supplier_counter_clicked'; props: { counter: 'referred' | 'under_review' | 'approved' } }
  | { name: 'referral_link_copied'; props: { source: ReferralSource; method: 'clipboard' | 'manual' } }
  | { name: 'referral_shared_whatsapp'; props: { source: ReferralSource; method: 'web_share' | 'wa_me' } }
  | { name: 'referral_share_cancelled'; props: { source: ReferralSource } }
  | { name: 'referral_qr_downloaded'; props: { format: 'png'; method: 'download' | 'long_press_hint' } }
  | { name: 'referral_open_page_clicked'; props: Record<string, never> }
  | { name: 'referral_printed'; props: Record<string, never> }
  | { name: 'clients_filtered'; props: { statuses: SupplierViewStatus[]; source: 'chip' | 'url' } }
  | { name: 'clients_sorted'; props: { by: 'applied' | 'updated' } }
  | { name: 'client_card_expanded'; props: { status: SupplierViewStatus } }
  | { name: 'clients_empty_cta_clicked'; props: Record<string, never> }
  | { name: 'clients_page_loaded'; props: { page: number } }
  // §3.5 Условия и материалы
  | { name: 'offer_tab_changed'; props: { tab: 'terms' | 'materials' } }
  | { name: 'material_downloaded'; props: { id: string; kind: 'pdf'; lang: MaterialLang; method: 'download' | 'external' } }
  | { name: 'material_opened'; props: { id: string; kind: 'video'; lang: MaterialLang } }
  | { name: 'material_shared'; props: { id: string; method: 'web_share' | 'copy' } }
  | { name: 'material_download_failed'; props: { id: string } }
  | { name: 'offer_external_link_clicked'; props: { href_host: string } };

export type EventName = AnalyticsEvent['name'];
export type EventProps<N extends EventName> = Extract<AnalyticsEvent, { name: N }>['props'];

/** Версия витрины, в которой событие появляется (колонка «v», 00-roadmap.md). */
export const EVENT_VERSIONS = {
  app_loaded: 'v1',
  auth_otp_requested: 'v1',
  auth_otp_failed: 'v1',
  auth_login_succeeded: 'v1',
  auth_multiple_applications_detected: 'v4',
  session_expired: 'v1',
  logout: 'v1',
  role_switched: 'v1',
  role_hint_shown: 'v1',
  role_hint_dismissed: 'v1',
  language_changed: 'v1',
  theme_changed: 'v1',
  support_contact_clicked: 'v1',
  network_offline: 'v5',
  network_restored: 'v5',
  storage_unavailable: 'v1',
  pwa_install_prompted: 'v5',
  pwa_installed: 'v5',
  pwa_update_prompted: 'v5',
  screen_viewed: 'v1',
  next_step_cta_clicked: 'v1',
  data_inconsistency: 'v1',
  document_upload_started: 'v2',
  document_upload_succeeded: 'v2',
  document_upload_failed: 'v2',
  document_prevalidation_failed: 'v2',
  document_file_deleted: 'v2',
  document_file_downloaded: 'v2',
  document_example_opened: 'v2',
  document_video_opened: 'v2',
  document_set_submitted: 'v2',
  documents_viewed_locked: 'v2',
  rejected_document_viewed: 'v2',
  rejected_document_reuploaded: 'v2',
  more_docs_banner_viewed: 'v2',
  previous_round_expanded: 'v2',
  document_added_by_odoo: 'v3',
  status_changed_while_open: 'v1',
  status_change_banner_viewed: 'v1',
  status_change_banner_dismissed: 'v1',
  review_overdue_viewed: 'v1',
  checklist_link_opened: 'v4',
  checklist_item_completed: 'v4',
  checklist_item_failed_viewed: 'v4',
  checklist_item_stale: 'v4',
  external_link_blocked: 'v4',
  limit_activated: 'v4',
  limit_cancelled_viewed: 'v4',
  limit_fully_used_viewed: 'v4',
  how_to_buy_viewed: 'v4',
  how_to_buy_whatsapp_clicked: 'v4',
  closed_reapply_clicked: 'v4',
  reapply_submitted: 'v4',
  reapply_pending_viewed: 'v4',
  returning_redirected_to_cabinet: 'v4',
  supplier_counter_clicked: 'v3',
  referral_link_copied: 'v3',
  referral_shared_whatsapp: 'v3',
  referral_share_cancelled: 'v3',
  referral_qr_downloaded: 'v3',
  referral_open_page_clicked: 'v3',
  referral_printed: 'v3',
  clients_filtered: 'v3',
  clients_sorted: 'v3',
  client_card_expanded: 'v3',
  clients_empty_cta_clicked: 'v3',
  clients_page_loaded: 'v3',
  offer_tab_changed: 'v5',
  material_downloaded: 'v5',
  material_opened: 'v5',
  material_shared: 'v5',
  material_download_failed: 'v5',
  offer_external_link_clicked: 'v5',
} as const satisfies Record<EventName, 'v1' | 'v2' | 'v3' | 'v4' | 'v5'>;

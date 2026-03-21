// TypeScript types for startup events system

// Database schema
export interface StartupEvent {
  id: string;
  external_id: string;
  source: string;
  title: string;
  organizer: string;
  event_type: '사업화' | '시설·공간' | '행사·네트워크' | '글로벌' | '창업교육';
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  registration_start_date: string | null;
  registration_end_date: string;
  registration_url: string | null;
  views_count: number;
  target_audience: string | null;
  interest_tags: string[];
  content_embedding: number[] | null;
  status: 'active' | 'expired' | 'closed';
  raw_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  last_synced_at: string;
}

// K-Startup API response types (actual API structure)
export interface KStartupAPIResponse {
  currentCount: number;
  data: KStartupEventItem[];
  matchCount: number;
  page: number;
  perPage: number;
  totalCount: number;
}

// Actual K-Startup API item fields
export interface KStartupEventItem {
  pbanc_sn: string;           // 공고일련번호 (announcement serial number)
  biz_pbanc_nm: string;       // 사업공고명 (business announcement name/title)
  pbanc_ntrp_nm: string;      // 공고기관명 (announcing organization name)
  supt_biz_clsfc: string;     // 지원사업분류 (support business classification)
  pbanc_ctnt: string;         // 공고내용 (announcement content)
  pbanc_rcpt_bgng_dt: string; // 공고접수시작일자 (registration start date)
  pbanc_rcpt_end_dt: string;  // 공고접수종료일자 (registration end date)
  detl_pg_url: string;        // 상세페이지URL (detail page URL)
  biz_aply_url?: string;      // 사업신청URL (business application URL)
  aply_trgt?: string;         // 신청대상 (application target)
  aply_trgt_ctnt?: string;    // 신청대상내용 (application target content)
  supt_regin?: string;        // 지원지역 (support region)
  sprv_inst?: string;         // 주관기관 (supervising institution)
  prfn_matr?: string;         // 우대사항 (preferential matters)
  [key: string]: string | undefined;
}

// Transformed event (before DB insert)
export interface TransformedEvent {
  external_id: string;
  source: string;
  title: string;
  organizer: string;
  event_type: '사업화' | '시설·공간' | '행사·네트워크' | '글로벌' | '창업교육';
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  registration_start_date: string | null;
  registration_end_date: string;
  registration_url: string | null;
  views_count: number;
  target_audience: string | null;
  raw_data: Record<string, unknown>;
}

// Sync result
export interface SyncResult {
  new_events: number;
  updated_events: number;
  expired_events: number;
  skipped_events: number;  // 이미 마감된 이벤트 (AI 처리 스킵)
  errors: Array<{
    external_id?: string;
    error: string;
  }>;
}

// K-Startup API options
export interface KStartupAPIOptions {
  page?: number;
  perPage?: number;
}

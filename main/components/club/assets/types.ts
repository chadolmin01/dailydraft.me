export interface AssetItem {
  id: string
  asset_type: string
  name: string
  url: string
  owner: {
    user_id: string | null
    display_name: string | null
    role_label: string | null
    avatar_url: string | null
  }
  credential_location: string | null
  notes: string | null
  needs_handover: boolean
  display_order: number
  updated_at: string
}

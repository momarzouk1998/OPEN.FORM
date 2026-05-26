// User types
export type UserRole = 'volunteer' | 'supervisor' | 'admin'
export type Gender = 'male' | 'female'
export type AccountStatus = 'pending' | 'approved' | 'rejected'

export interface User {
  id: string
  email: string
  phone: string
  name: string
  gender: Gender
  role: UserRole
  status: AccountStatus
  avatar_url?: string
  created_at: string
  updated_at: string
  time_limit?: number | null
  expires_at?: string | null
  allow_delete_responses?: boolean
  randomize_questions?: boolean
  allow_multiple?: boolean
  banned?: boolean
  form_limit?: number | null
  submission_limit?: number | null
  is_partner?: boolean
}

// Project types
export interface ProjectModules {
  forms?: boolean
}

export interface Project {
  id: string
  name: string
  description: string
  icon: string
  color: string
  target_gender: 'male' | 'female' | 'both'
  image_url?: string | null
  modules?: ProjectModules
  visibility?: 'public' | 'private'
  is_archived?: boolean
  original_project_id?: string | null
  created_by: string
  created_at: string
  updated_at: string
}

export interface ProjectInvite {
  id: string
  project_id: string
  token: string
  max_uses: number
  use_count: number
  expires_at: string | null
  created_by: string
  created_at: string
}

export interface UserProject {
  id: string
  user_id: string
  project_id: string
  expires_at?: string | null
  created_at: string
}

export interface ProjectSupervisor {
  id: string
  project_id: string
  user_id: string
  created_by: string
  created_at: string
  profiles?: { name: string; email: string }
}

export interface ProjectBan {
  id: string
  project_id: string
  user_id: string
  created_by: string
  created_at: string
  profiles?: { name: string; email: string }
}

export interface Notification {
  id: string
  user_id: string
  title: string
  body?: string
  type: string
  link?: string
  is_read: boolean
  created_at: string
}

// Form types
export type VisibilityOperator = 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'

export interface VisibilityRule {
  question_id: string
  operator: VisibilityOperator
  value: string
}

export type QuestionType = 
  | 'text'
  | 'textarea'
  | 'single_choice'
  | 'multiple_choice'
  | 'scale'
  | 'ranking'
  | 'matrix'
  | 'dropdown'
  | 'date'
  | 'time'
  | 'file_upload'
  | 'static_text'
  | 'static_image'
  | 'divider'
  | 'signature'
  | 'star_rating'
  | 'terms'
  | 'date_range'
  | 'slider'
  | 'button_choice'
  | 'email_confirm'
  | 'youtube'
  | 'match_items'
  | 'appointment'
  // إضافات (Add-ons)
  | 'countdown_timer'
  | 'products_block'
  | 'payment_info_block'


export interface QuestionOption {
  id: string
  text: string
  points: number
  counter_target?: number | null
  validation_type?: string
  validation_category?: string
  validation_value?: string
  validation_min?: string
  validation_max?: string
}

export interface Question {
  id: string
  form_id: string
  text: string
  type: QuestionType
  order: number
  required: boolean
  points: number
  options?: QuestionOption[]
  has_counter?: boolean
  row_group?: number | null
  page?: number
  visibility_rules?: VisibilityRule[]
}

export interface Form {
  id: string
  project_id: string
  name: string
  description: string
  serial_number?: string
  short_code?: string
  created_by: string
  created_at: string
  updated_at: string
  time_limit?: number | null
  expires_at?: string | null
  allow_delete_responses?: boolean
  randomize_questions?: boolean
  allow_multiple?: boolean
  enable_auto_save?: boolean
  redirect_rules?: any[]
  default_redirect_url?: string
  questions?: Question[]
  page_titles?: Record<string, any>
}

// Response types
export interface FormResponse {
  id: string
  form_id: string
  user_id: string
  score: number
  max_score: number
  submitted_at: string
}

// Notification types
export type NotificationType = 'assignment' | 'info'

export interface NotificationPreference {
  id: string
  user_id: string
  notification_type: NotificationType
  enabled: boolean
  created_at: string
}

// Form template types
export interface FormTemplate {
  id: string
  name: string
  description: string
  category: string
  image_url?: string | null
  questions_data: any[]
  form_settings: Record<string, any>
  is_featured: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export const TEMPLATE_CATEGORIES: Record<string, string> = {
  medical: 'طبية',
  survey: 'استبيانات',
  employment: 'توظيف',
  education: 'تعليمية',
  education_centers: 'مراكز تعليم',
  clinics: 'عيادات',
  restaurants: 'مطاعم',
  shipping: 'شحن',
  real_estate: 'عقارات',
  schools: 'مدارس',
  small_business: 'شركات صغيرة',
}

// Dashboard stats
export interface DashboardStats {
  total_users: number
  total_projects: number
  total_forms: number
  pending_approvals: number
  average_score: number
}

// Form Theme Settings
export interface ThemeSettings {
  pageColor?: string
  formBgColor?: string
  textColor?: string
  primaryColor?: string
  borderRadius?: string
  spacing?: 'compact' | 'normal' | 'cozy'
  fontFamily?: string
  themeName?: string
  formWidth?: number
  flatLayout?: boolean
  borderStyle?: 'none' | 'solid' | 'dashed'
  borderWidth?: number
}

// Partner / Success Partners types
export interface PartnerIdea {
  id: string
  partner_id: string
  text: string
  implemented: boolean
  created_at: string
  profiles?: { name: string; avatar_url: string }[]
}

export interface PartnerLike {
  id: string
  partner_id: string
  user_id: string
  created_at: string
}

export interface Referral {
  id: string
  referrer_id: string
  referred_email?: string | null
  referred_id?: string | null
  status: 'pending' | 'completed'
  created_at: string
}

export interface UserTemplate {
  id: string
  form_id?: string
  created_by: string
  name: string
  description: string
  category?: string
  usage_count?: number
  is_published?: boolean
  approved: boolean
  created_at: string
  profiles?: { name: string; avatar_url: string }[]
  forms?: { id: string; name: string }[]
}

// Points & Referrals System
export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  plan_price_gross: number
  plan_price_net: number
  tax_amount: number
  status: 'active' | 'cancelled' | 'expired'
  started_at: string
  expires_at: string
  renewed_at?: string | null
  referred_by?: string | null
  renewal_count: number
  created_at: string
  profiles?: { name: string; email: string; avatar_url?: string }[]
}

export interface AgentCommission {
  id: string
  agent_id: string
  client_id: string
  subscription_id: string
  renewal_number: number
  gross_commission: number
  tax_deducted: number
  net_commission: number
  status: 'pending' | 'available' | 'paid' | 'cancelled'
  available_at?: string | null
  type: 'commission' | 'refund_deduction'
  created_at: string
}

export interface TemplatePoint {
  id: string
  template_owner_id: string
  template_id: string
  copied_by_id: string
  subscription_id?: string | null
  points: number
  status: 'pending' | 'available' | 'paid' | 'cancelled'
  available_at?: string | null
  created_at: string
}

export interface WithdrawalRequest {
  id: string
  user_id: string
  type: 'points' | 'commission'
  amount_requested: number
  amount_after_tax: number
  tax_deducted: number
  points_used?: number | null
  payment_method: 'instapay' | 'vodafone_cash' | 'orange_cash' | 'etisalat_cash'
  payment_account: string
  status: 'pending' | 'approved' | 'paid' | 'rejected'
  admin_id?: string | null
  admin_note?: string | null
  requested_at: string
  processed_at?: string | null
  profiles?: { name: string; email: string }[]
}

export interface AdminActionLog {
  id: string
  admin_id: string
  action_type: string
  target_id: string
  target_type: string
  old_value?: any
  new_value?: any
  note?: string | null
  created_at: string
  profiles?: { name: string }[]
}

export interface EarningsSummary {
  points_balance: number
  points_pending: number
  commission_balance: number
  commission_pending: number
  total_referrals: number
  active_referrals: number
  total_points_earned: number
  total_commission_earned: number
  total_points_withdrawn: number
  total_commission_withdrawn: number
}

export const PAYMENT_METHODS: Record<string, string> = {
  instapay: 'انستاباي',
  vodafone_cash: 'فودافون كاش',
  orange_cash: 'أورنج كاش',
  etisalat_cash: 'اتصالات كاش',
}

export const WITHDRAWAL_STATUS: Record<string, string> = {
  pending: 'قيد الانتظار',
  approved: 'تمت الموافقة',
  paid: 'تم الدفع',
  rejected: 'مرفوض',
}

export const COMMISSION_STATUS: Record<string, string> = {
  pending: 'معلق',
  available: 'متاح للسحب',
  paid: 'تم السحب',
  cancelled: 'ملغي',
}

export const SUBSCRIPTION_STATUS: Record<string, string> = {
  active: 'نشط',
  cancelled: 'ملغي',
  expired: 'منتهي',
}

export const WITHDRAWAL_TYPE_LABELS: Record<string, string> = {
  points: 'نقاط قوالب',
  commission: 'عمولة وكيل',
}

export const CLIENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'نشط', color: 'text-green-600 bg-green-50' },
  pending: { label: 'معلق', color: 'text-yellow-600 bg-yellow-50' },
  expired: { label: 'منتهي', color: 'text-red-600 bg-red-50' },
  cancelled: { label: 'ملغي', color: 'text-gray-600 bg-gray-50' },
}

export interface PartnerProfile extends User {
  company?: string
  facebook_url?: string
  linkedin_url?: string
  youtube_url?: string
  other_links?: { label: string; url: string }[]
  bio?: string
  is_partner?: boolean
  referral_code?: string
  referral_count?: number
  likes_count?: number
  forms_count?: number
  templates_count?: number
  submissions_count?: number
  ideas?: PartnerIdea[]
  liked_by_me?: boolean
}



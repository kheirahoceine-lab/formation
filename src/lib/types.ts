export type UserRole = "student" | "influencer" | "admin";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
};

export type Course = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price_da: number;
  cover_image: string | null;
  is_published: boolean;
  created_at: string;
};

export type Lesson = {
  id: string;
  course_id: string;
  title: string;
  video_url: string | null;
  order_index: number;
  is_free_preview: boolean;
  created_at: string;
};

export type LessonFile = {
  id: string;
  lesson_id: string;
  file_url: string;
  file_name: string;
  created_at: string;
};

export type EnrollmentStatus = "pending" | "active" | "rejected";

export type Enrollment = {
  id: string;
  student_id: string;
  course_id: string;
  status: EnrollmentStatus;
  progress_percent: number;
  referred_by: string | null;
  enrolled_at: string;
};

export type PaymentMethod = "baridimob" | "ccp" | "chargily";
export type PaymentStatus = "pending" | "confirmed" | "rejected";

export type Payment = {
  id: string;
  enrollment_id: string;
  amount_da: number;
  method: PaymentMethod;
  receipt_image_url: string | null;
  status: PaymentStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type CommissionType = "percent" | "fixed";
export type InfluencerStatus = "pending" | "approved" | "rejected";

export type Influencer = {
  id: string;
  user_id: string;
  promo_code: string;
  referral_slug: string;
  commission_type: CommissionType;
  commission_value: number;
  status: InfluencerStatus;
  created_at: string;
};

export type CommissionStatus = "pending" | "paid";

export type Commission = {
  id: string;
  influencer_id: string;
  enrollment_id: string;
  payment_id: string;
  amount_da: number;
  status: CommissionStatus;
  created_at: string;
};

export type PayoutStatus = "pending" | "approved" | "paid";

export type PayoutRequest = {
  id: string;
  influencer_id: string;
  amount_requested: number;
  status: PayoutStatus;
  bank_info: string | null;
  requested_at: string;
  processed_at: string | null;
};

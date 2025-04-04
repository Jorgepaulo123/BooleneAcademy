
export interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  profile_picture?: string;
  created_at: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  price: number;
  duration_minutes: number;
  cover_image: string;
  uploaded_by: number;
  created_at: string;
  liked?: boolean;
  likes_count?: number;
}

export interface WalletTransaction {
  amount: number;
  transaction_type: string;
  status: string;
  created_at: string;
  payment_ref?: string;
}

export interface Wallet {
  balance: number;
  transactions: WalletTransaction[];
}

export interface DepositRequest {
  amount: number;
  mobile: string;
}

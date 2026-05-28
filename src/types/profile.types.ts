
export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  avatar_url?: string;
  pin?: string;
  is_kids_profile?: boolean;
  banner_id?: string;
  decoration_id?: string;
  background_url?: string;
  created_at: string;
}

export interface ProfileContextType {
  profiles: UserProfile[];
  currentProfile: UserProfile | null;
  loadingProfiles: boolean;
  isRefreshing: boolean;
  createProfile: (profileData: Omit<UserProfile, 'id' | 'user_id' | 'created_at'>) => Promise<UserProfile>;
  updateProfile: (id: string, profileData: any) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  selectProfile: (profile: UserProfile, pin?: string) => boolean;
  verifyPin: (profileId: string, pin: string) => Promise<boolean>;
  setCurrentProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  refreshProfiles: () => Promise<UserProfile[]>;
  clearProfile: () => void;
}


import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, ProfileContextType } from '@/types/profile.types';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/services/profileService';
import { useToast } from '@/components/ui/use-toast';

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, initialized } = useAuth();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const clearProfileState = useCallback(() => {
    console.log('Clearing profile state');
    setProfiles([]);
    setCurrentProfile(null);
    localStorage.removeItem('lastProfileId');
  }, []);

  const refreshProfiles = useCallback(async (): Promise<UserProfile[]> => {
    if (!user) {
      clearProfileState();
      return [];
    }

    try {
      setIsRefreshing(true);
      console.log('Refreshing profiles for user:', user.id);
      
      const userProfiles = await profileService.getProfiles(user.id);
      console.log('Profiles loaded:', userProfiles.length);
      
      setProfiles(userProfiles);
      
      const lastProfileId = localStorage.getItem('lastProfileId');
      const nextProfile = lastProfileId
        ? userProfiles.find(profile => profile.id === lastProfileId) ?? null
        : currentProfile
          ? userProfiles.find(profile => profile.id === currentProfile.id) ?? null
          : null;

      if (nextProfile) {
        console.log('Restoring active profile:', nextProfile.name);
        setCurrentProfile(nextProfile);
      } else if (lastProfileId) {
        console.log('Saved profile not found, clearing');
        localStorage.removeItem('lastProfileId');
        setCurrentProfile(null);
      }
      
      return userProfiles;
    } catch (error) {
      console.error('Error refreshing profiles:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar perfis',
        variant: 'destructive',
      });
      return [];
    } finally {
      setIsRefreshing(false);
    }
  }, [user, currentProfile?.id, toast, clearProfileState]);

  // Carregar perfis quando o usuário for autenticado
  useEffect(() => {
    if (!initialized) return;

    if (user) {
      setLoadingProfiles(true);
      refreshProfiles().finally(() => {
        setLoadingProfiles(false);
      });
    } else {
      clearProfileState();
      setLoadingProfiles(false);
    }
  }, [user, initialized, refreshProfiles, clearProfileState]);

  useEffect(() => {
    if (currentProfile?.id) {
      localStorage.setItem('lastProfileId', currentProfile.id);
    }
  }, [currentProfile?.id]);

  const createProfile = async (profileData: Omit<UserProfile, 'id' | 'user_id' | 'created_at'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      console.log('Creating profile:', profileData.name);
      const newProfile = await profileService.createProfile(user.id, profileData);
      
      setProfiles(prev => [...prev, newProfile]);
      
      toast({
        title: 'Perfil criado',
        description: `Perfil "${newProfile.name}" criado com sucesso!`,
      });
      
      return newProfile;
    } catch (error: any) {
      console.error('Error creating profile:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao criar perfil',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateProfile = async (id: string, profileData: any) => {
    if (!user) throw new Error('User not authenticated');

    try {
      console.log('Updating profile:', id);
      await profileService.updateProfile(id, profileData);
      
      const updatedProfiles = profiles.map(profile =>
        profile.id === id ? { ...profile, ...profileData } : profile
      );
      
      setProfiles(updatedProfiles);
      
      // Atualizar perfil atual se for o mesmo
      if (currentProfile?.id === id) {
        setCurrentProfile({ ...currentProfile, ...profileData });
      }
      
      toast({
        title: 'Perfil atualizado',
        description: 'Perfil atualizado com sucesso!',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao atualizar perfil',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteProfile = async (id: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      console.log('Deleting profile:', id);
      await profileService.deleteProfile(id);
      
      setProfiles(prev => prev.filter(profile => profile.id !== id));
      
      // Limpar perfil atual se for o mesmo que está sendo deletado
      if (currentProfile?.id === id) {
        setCurrentProfile(null);
        localStorage.removeItem('lastProfileId');
      }
      
      toast({
        title: 'Perfil excluído',
        description: 'Perfil excluído com sucesso!',
      });
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao excluir perfil',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const selectProfile = (profile: UserProfile, pin?: string): boolean => {
    try {
      if (profile.pin && profile.pin !== pin) {
        return false;
      }
      
      console.log('Selecting profile:', profile.name);
      setCurrentProfile(profile);
      localStorage.setItem('lastProfileId', profile.id);
      
      return true;
    } catch (error) {
      console.error('Error selecting profile:', error);
      return false;
    }
  };

  const verifyPin = async (profileId: string, pin: string): Promise<boolean> => {
    try {
      const profile = profiles.find(p => p.id === profileId);
      return profile?.pin === pin;
    } catch (error) {
      console.error('Error verifying PIN:', error);
      return false;
    }
  };

  const clearProfile = useCallback(() => {
    console.log('Clearing current profile');
    setCurrentProfile(null);
    localStorage.removeItem('lastProfileId');
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        currentProfile,
        loadingProfiles,
        isRefreshing,
        createProfile,
        updateProfile,
        deleteProfile,
        selectProfile,
        verifyPin,
        setCurrentProfile,
        refreshProfiles,
        clearProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfiles = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfiles must be used within a ProfileProvider');
  }
  return context;
};

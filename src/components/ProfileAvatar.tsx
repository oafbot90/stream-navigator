import React, { useMemo, useState, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface CachedAvatar {
  id: string;
  url: string;
  name: string;
  color: string;
  position: number;
}

// Simple in-memory cache
let cachedAvatars: CachedAvatar[] | null = null;
let fetchPromise: Promise<CachedAvatar[]> | null = null;

async function loadAvatars(): Promise<CachedAvatar[]> {
  if (cachedAvatars) return cachedAvatars;
  if (fetchPromise) return fetchPromise;
  
  fetchPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('app_avatars')
        .select('id, url, name, color, position')
        .order('position', { ascending: true });
      
      if (error || !data || data.length === 0) {
        cachedAvatars = [];
        return [];
      }
      cachedAvatars = data as CachedAvatar[];
      return cachedAvatars;
    } catch {
      cachedAvatars = [];
      return [];
    }
  })();
  
  return fetchPromise;
}

// Background colors for fallback
const fallbackBgColors = [
  'bg-red-600', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500', 'bg-purple-500',
  'bg-pink-500', 'bg-orange-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-emerald-500',
];

interface ProfileAvatarProps {
  avatarUrl: string | null | undefined;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  avatarClassName?: string;
  imageClassName?: string;
  frameStyle?: 'default' | 'none';
}

const ProfileAvatar: React.FC<ProfileAvatarProps> = ({ 
  avatarUrl, 
  name, 
  size = 'md',
  className = '',
  avatarClassName = '',
  imageClassName = '',
  frameStyle = 'default',
}) => {
  const [avatars, setAvatars] = useState<CachedAvatar[]>(cachedAvatars || []);

  useEffect(() => {
    if (!cachedAvatars) {
      loadAvatars().then(setAvatars);
    }
  }, []);

  const { imageUrl, bgColor } = useMemo(() => {
    // If avatarUrl is a direct URL (http), use it directly
    if (avatarUrl && avatarUrl.startsWith('http')) {
      return { imageUrl: avatarUrl, bgColor: fallbackBgColors[0] };
    }

    // Handle data:avatar/X format
    if (avatarUrl && avatars.length > 0) {
      const match = avatarUrl.match(/data:avatar\/(\d+)$/);
      if (match) {
        const index = parseInt(match[1]);
        if (index >= 0 && index < avatars.length) {
          return {
            imageUrl: avatars[index].url,
            bgColor: `bg-gradient-to-br ${avatars[index].color}`
          };
        }
      }
    }

    // Default: first avatar or fallback
    if (avatars.length > 0) {
      return { imageUrl: avatars[0].url, bgColor: `bg-gradient-to-br ${avatars[0].color}` };
    }

    return { imageUrl: '', bgColor: fallbackBgColors[0] };
  }, [avatarUrl, avatars]);

  const sizeClasses = {
    xs: 'h-5 w-5',
    sm: 'h-9 w-9 sm:h-10 sm:w-10',
    md: 'h-12 w-12 sm:h-14 sm:w-14',
    lg: 'h-18 w-18 sm:h-20 sm:w-20',
    xl: 'h-24 w-24 sm:h-28 sm:w-28'
  };
  
  const textSizeClasses = {
    xs: 'text-[8px]',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-xl'
  };

  return (
    <div className={cn('relative shrink-0', className)}>
      <Avatar
        className={cn(
          sizeClasses[size],
          'overflow-hidden rounded-full',
          frameStyle === 'default'
            ? 'border-2 border-border/50 shadow-lg hover:border-primary/70 transition-colors duration-200'
            : 'border-0 shadow-none',
          avatarClassName,
        )}
      >
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={name || "Avatar"} 
            className={cn('h-full w-full object-cover object-center', imageClassName)}
            loading="lazy"
          />
        ) : (
          <AvatarFallback className={`${bgColor} text-white font-bold ${textSizeClasses[size]}`}>
            {name ? name.charAt(0).toUpperCase() : <User className="w-1/2 h-1/2" />}
          </AvatarFallback>
        )}
      </Avatar>
    </div>
  );
};

export default ProfileAvatar;

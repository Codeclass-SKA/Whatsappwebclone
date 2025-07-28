import React from 'react';

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ src, alt, size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Hide the broken image and show initials instead
    e.currentTarget.style.display = 'none';
    const parent = e.currentTarget.parentElement;
    if (parent) {
      const initialsElement = parent.querySelector('.avatar-initials');
      if (initialsElement) {
        (initialsElement as HTMLElement).style.display = 'flex';
      }
    }
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      {/* Image */}
      {src && (
        <img
          src={src}
          alt={alt}
          className="w-full h-full rounded-full object-cover"
          onError={handleImageError}
        />
      )}
      
      {/* Fallback with initials */}
      <div 
        className={`avatar-initials w-full h-full rounded-full bg-green-500 text-white flex items-center justify-center font-semibold text-sm ${
          src ? 'hidden' : 'flex'
        }`}
      >
        {getInitials(alt)}
      </div>
    </div>
  );
};

export default Avatar; 
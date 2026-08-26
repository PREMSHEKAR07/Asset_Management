import React from 'react';

const getInitials = (name) => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarStyle = () => {
  return 'bg-[#1E3A8A] text-white border-blue-900/20 shadow-blue-900/5';
};

const Avatar = ({ name, src, image, avatar, className = 'h-10 w-10 rounded-xl', textSize = 'text-xs' }) => {
  const imgSrc = src || image || avatar;
  const initials = getInitials(name);
  const colorClass = getAvatarStyle(name);
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [imgSrc]);

  if (imgSrc && !imgError) {
    return (
      <div
        className={`${className} overflow-hidden border border-slate-200/80 shadow-sm shrink-0 bg-slate-100 flex items-center justify-center`}
        title={name}
      >
        <img
          src={imgSrc}
          alt={name || 'Avatar'}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${className} ${colorClass} border flex items-center justify-center font-bold tracking-wider select-none shrink-0 uppercase shadow-sm ${textSize}`}
      title={name}
    >
      {initials}
    </div>
  );
};

export default Avatar;

import React from 'react';

type IconLike = React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

interface SafeIconProps {
  icon: unknown;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
}

const SafeIcon: React.FC<SafeIconProps> = ({ icon, className, style, title }) => {
  const Icon = icon as IconLike;

  if (!Icon || (typeof Icon !== 'function' && typeof Icon !== 'object')) {
    return (
      <span
        className={className}
        style={{ display: 'inline-block', width: '1em', height: '1em', ...style }}
        aria-label={title}
      />
    );
  }

  return <Icon className={className} style={style} />;
};

export default SafeIcon;

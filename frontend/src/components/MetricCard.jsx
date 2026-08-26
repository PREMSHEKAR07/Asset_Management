import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MetricCard = ({
  icon: Icon,
  title,
  value,
  color = 'blue',
  subtext,
  linkTo,
  showLink = false,
  onClick,
  isActive = false,
}) => {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    } else if (linkTo) {
      navigate(linkTo);
    }
  };

  const isInteractive = Boolean(onClick || linkTo);

  // Soft icon background colors matching the reference design
  const colorMaps = {
    blue: {
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-500',
    },
    green: {
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
    },
    orange: {
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
    },
    red: {
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-500',
    },
    purple: {
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-500',
    },
    teal: {
      iconBg: 'bg-teal-50',
      iconColor: 'text-teal-500',
    },
  };

  const theme = colorMaps[color] || colorMaps.blue;

  return (
    <div
      onClick={handleClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      style={{ cursor: isInteractive ? 'pointer' : 'default' }}
      className={`bg-white border ${
        isActive
          ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-md scale-[1.02]'
          : 'border-slate-100 hover:border-slate-300'
      } rounded-2xl p-5 flex flex-col ${
        isInteractive ? 'cursor-pointer hover:shadow-md hover:scale-[1.03]' : ''
      } transition-all duration-200 select-none`}
      title={isInteractive ? `Click to filter/view ${title}` : title}
    >
      {/* Top: icon + text */}
      <div className="flex items-center gap-4 cursor-pointer">
        {/* Icon pill */}
        <div className={`${theme.iconBg} ${theme.iconColor} p-2.5 rounded-xl shrink-0 self-center cursor-pointer`}>
          <Icon className="h-4 w-4 cursor-pointer" strokeWidth={1.75} />
        </div>

        {/* Text block — fixed title height so numbers align across all cards */}
        <div className="flex flex-col justify-center gap-1 min-w-0 cursor-pointer">
          <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest leading-snug h-[2.5em] overflow-hidden cursor-pointer">{title}</p>
          <h3 className="text-2xl font-extrabold text-slate-800 leading-none tracking-tight cursor-pointer">{value}</h3>
          {subtext && (
            <p className="text-xs font-medium text-slate-400 leading-snug truncate cursor-pointer">{subtext}</p>
          )}
        </div>
      </div>

      {/* View Details footer */}
      {showLink && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between cursor-pointer">
          <span className="text-[11px] font-bold text-slate-400 hover:text-indigo-500 transition-colors cursor-pointer">View Details</span>
          <ChevronRight className="h-3.5 w-3.5 text-slate-300 cursor-pointer" />
        </div>
      )}
    </div>
  );
};

export default MetricCard;

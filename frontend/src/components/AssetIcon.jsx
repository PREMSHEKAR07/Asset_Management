import React from 'react';
import {
  Laptop,
  Monitor,
  Mouse,
  Keyboard,
  Headphones,
  Printer,
  Cpu,
  Box,
  Sliders,
  Armchair,
  Table
} from 'lucide-react';

export const getAssetIconComponent = (typeStr) => {
  const t = (typeStr || '').toLowerCase();
  if (t.includes('laptop')) return Laptop;
  if (t.includes('monitor') || t.includes('screen') || t.includes('display')) return Monitor;
  if (t.includes('mouse')) return Mouse;
  if (t.includes('keyboard')) return Keyboard;
  if (t.includes('headphone') || t.includes('headset')) return Headphones;
  if (t.includes('printer')) return Printer;
  if (t.includes('cpu') || t.includes('desktop')) return Cpu;
  if (t.includes('chair')) return Armchair;
  if (t.includes('table')) return Table;
  if (t.includes('dock')) return Sliders;
  return Box;
};

export const AssetIconBadge = ({ type, className = "h-7 w-7", iconSize = "h-4 w-4" }) => {
  const IconComp = getAssetIconComponent(type);

  const theme = "bg-[#f4f1ee] text-[#1E3A8A] border-[#e2deda]";

  return (
    <div className={`rounded-xl border flex items-center justify-center shrink-0 shadow-xs ${theme} ${className}`}>
      <IconComp className={iconSize} />
    </div>
  );
};

export default AssetIconBadge;

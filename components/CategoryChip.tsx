import { Construction, Trash2, Lightbulb, Droplet, Waves, TriangleAlert, MoreHorizontal } from 'lucide-react';
import { IssueCategory, CATEGORY_LABELS, CATEGORY_STYLE } from '@/types';

export const CATEGORY_ICONS: Record<IssueCategory, typeof Construction> = {
  pothole: Construction,
  garbage: Trash2,
  streetlight: Lightbulb,
  water: Droplet,
  drainage: Waves,
  encroachment: TriangleAlert,
  other: MoreHorizontal,
};

export function CategoryChip({ category }: { category: IssueCategory }) {
  const { color, bg } = CATEGORY_STYLE[category];
  const Icon = CATEGORY_ICONS[category];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full py-1 pl-2 pr-2.5 text-[11px] font-semibold"
      style={{ backgroundColor: bg, color }}
    >
      <Icon size={12} strokeWidth={2.5} />
      {CATEGORY_LABELS[category]}
    </span>
  );
}

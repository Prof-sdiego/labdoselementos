import { getNivel, getProgressoNivel, NIVEIS } from '@/types/game';
import { cn } from '@/lib/utils';

const levelColorClass: Record<number, string> = {
  1: 'text-level-1',
  2: 'text-level-2',
  3: 'text-level-3',
  4: 'text-level-4',
  5: 'text-level-5',
  6: 'text-level-6',
  7: 'text-level-7',
};

const levelBgClass: Record<number, string> = {
  1: 'bg-level-1',
  2: 'bg-level-2',
  3: 'bg-level-3',
  4: 'bg-level-4',
  5: 'bg-level-5',
  6: 'bg-level-6',
  7: 'bg-level-7',
};

interface LevelBadgeProps {
  xp: number;
  size?: 'sm' | 'md' | 'lg';
}

export function LevelBadge({ xp, size = 'md' }: LevelBadgeProps) {
  const nivel = getNivel(xp);
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-display font-bold border border-current/20',
      levelColorClass[nivel.nivel],
      `bg-current/10`,
      sizeClasses[size]
    )} style={{ backgroundColor: `hsl(var(--level-${nivel.nivel}) / 0.15)` }}>
      Nv.{nivel.nivel} — {nivel.nome}
    </span>
  );
}

interface XPProgressBarProps {
  xp: number;
  showLabel?: boolean;
  className?: string;
}

export function XPProgressBar({ xp, showLabel = true, className }: XPProgressBarProps) {
  const { atual, proximo, progresso } = getProgressoNivel(xp);

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between text-xs mb-1 font-mono">
          <span className={levelColorClass[atual.nivel]}>{atual.nome}</span>
          <span className="text-muted-foreground">
            {proximo ? `${xp} / ${proximo.xpNecessario} XP` : `${xp} XP (MAX)`}
          </span>
        </div>
      )}
      <div className="h-2.5 rounded-full bg-secondary overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700 ease-out', levelBgClass[atual.nivel])}
          style={{ width: `${progresso}%` }}
        />
      </div>
    </div>
  );
}

import Icon from '@mdi/react';
import {
  mdiClockOutline,
  mdiCheckboxMarkedOutline,
  mdiMicrophone,
  mdiNoteTextOutline,
  mdiPlus,
  mdiViewColumnOutline,
} from '@mdi/js';
import type { LogbookMode } from '@/domain/types';
import { Button } from '@/ui/design-system/Button';
import { Card } from '@/ui/design-system/Card';
import { useI18n } from '@/ui/i18n/I18nContext';

export interface ModeSelectorProps {
  readonly selectedMode: LogbookMode;
  readonly sessionTitle: string;
  readonly onSelectMode: (mode: LogbookMode) => void;
  readonly onChangeTitle: (title: string) => void;
  readonly onStartRecording: () => void;
  readonly onAddManualBlock: () => void;
}

interface ModeOptionMeta {
  readonly mode: LogbookMode;
  readonly icon: string;
  readonly title: string;
  readonly description: string;
}

function ModeOptionCard({
  option,
  isSelected,
  onSelect,
}: {
  readonly option: ModeOptionMeta;
  readonly isSelected: boolean;
  readonly onSelect: (mode: LogbookMode) => void;
}) {
  const borderClass = isSelected
    ? 'border-[var(--color-primary-base)] bg-[var(--color-primary-light)]/50'
    : 'border-[var(--color-surface-border)] bg-[var(--color-surface-card)] hover:bg-[var(--color-surface-muted)]/60';

  return (
    <button
      type="button"
      onClick={() => onSelect(option.mode)}
      className={`text-left p-4 rounded-xl border transition-colors cursor-pointer flex flex-col gap-2 ${borderClass}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-base font-medium text-[var(--color-text-primary)]">
          {option.title}
        </span>
        <span className="p-1.5 rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary-base)]">
          <Icon path={option.icon} size={0.85} />
        </span>
      </div>
      <p className="text-sm font-normal text-[var(--color-text-secondary)] leading-5">
        {option.description}
      </p>
    </button>
  );
}

export function ModeSelector({
  selectedMode,
  sessionTitle,
  onSelectMode,
  onChangeTitle,
  onStartRecording,
  onAddManualBlock,
}: ModeSelectorProps) {
  const { t } = useI18n();
  const options: readonly ModeOptionMeta[] = [
    { mode: 'CHRONO_LOG', icon: mdiClockOutline, title: t.modes.chronoTitle, description: t.modes.chronoDesc },
    { mode: 'QUICK_NOTE', icon: mdiNoteTextOutline, title: t.modes.quickTitle, description: t.modes.quickDesc },
    { mode: 'ACTION_ITEMS', icon: mdiCheckboxMarkedOutline, title: t.modes.tasksTitle, description: t.modes.tasksDesc },
    { mode: 'DAILY_STANDUP', icon: mdiViewColumnOutline, title: t.modes.standupTitle, description: t.modes.standupDesc },
  ];

  return (
    <div className="max-w-3xl mx-auto w-full px-4 py-6 flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs uppercase tracking-wider font-semibold text-[var(--color-primary-base)]">
          {t.modes.sectionLabel}
        </span>
        <h2 className="text-2xl font-medium text-[var(--color-text-primary)] leading-8">
          {t.modes.title}
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] leading-5">
          {t.modes.subtitle}
        </p>
      </div>

      <Card className="p-4 flex flex-col gap-2">
        <label className="text-xs uppercase tracking-wider font-semibold text-[var(--color-text-muted)]">
          {t.review.sessionTitleLabel}
        </label>
        <input
          type="text"
          value={sessionTitle}
          onChange={(e) => onChangeTitle(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-surface-border)] bg-[var(--color-surface-base)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary-base)]"
        />
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map((option) => (
          <ModeOptionCard
            key={option.mode}
            option={option}
            isSelected={selectedMode === option.mode}
            onSelect={onSelectMode}
          />
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
        <Button variant="secondary" size="lg" onClick={onStartRecording} className="flex-1">
          <Icon path={mdiMicrophone} size={0.9} />
          <span>{t.modes.startRecordingBtn}</span>
        </Button>
        <Button variant="ghost" size="lg" onClick={onAddManualBlock}>
          <Icon path={mdiPlus} size={0.85} />
          <span>{t.modes.addTextBlockBtn}</span>
        </Button>
      </div>
    </div>
  );
}

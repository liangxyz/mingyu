interface PromptShortcutPanelProps {
  actions: ReadonlyArray<{ label: string }>;
  activeMode: string;
  onApplyMode: (mode: string) => void;
  showCustomAndInspiration: boolean;
  customDraft: string;
  onCustomDraftChange: (value: string) => void;
  customPlaceholder: string;
  onOpenInspiration: () => void;
  quickGridClassName?: string;
  showCustomAction?: boolean;
  showInspirationAction?: boolean;
  alwaysShowCustomField?: boolean;
  customFieldTitle?: string;
}

export function PromptShortcutPanel({
  actions,
  activeMode,
  onApplyMode,
  showCustomAndInspiration,
  customDraft,
  onCustomDraftChange,
  customPlaceholder,
  onOpenInspiration,
  quickGridClassName,
  showCustomAction = showCustomAndInspiration,
  showInspirationAction = showCustomAndInspiration,
  alwaysShowCustomField = false,
  customFieldTitle = '自定义问题',
}: PromptShortcutPanelProps) {
  const shouldShowCustomField =
    (showCustomAction && activeMode === '自定义') || alwaysShowCustomField;

  return (
    <>
      <div className={`quick-grid${quickGridClassName ? ` ${quickGridClassName}` : ''}`}>
        {actions.map((item) => (
          <button
            key={item.label}
            type="button"
            className={`quick-chip ${activeMode === item.label ? 'is-active' : ''}`}
            onClick={() => onApplyMode(item.label)}
          >
            {item.label}
          </button>
        ))}
        {showCustomAction ? (
          <button
            type="button"
            className={`quick-chip ${activeMode === '自定义' ? 'is-active' : ''}`}
            onClick={() => onApplyMode('自定义')}
          >
            自定义
          </button>
        ) : null}
        {showInspirationAction ? (
          <>
            <button
              type="button"
              className={`quick-chip ${activeMode === '问题灵感' ? 'is-active' : ''}`}
              onClick={onOpenInspiration}
            >
              问题灵感
            </button>
          </>
        ) : null}
      </div>

      {shouldShowCustomField ? (
        <label className="field-card">
          <div className="field-header">
            <span>{customFieldTitle}</span>
          </div>
          <textarea
            rows={6}
            value={customDraft}
            placeholder={customPlaceholder}
            onChange={(event) => onCustomDraftChange(event.target.value)}
          />
        </label>
      ) : null}
    </>
  );
}

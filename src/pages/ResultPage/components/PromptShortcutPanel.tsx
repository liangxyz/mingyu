interface PromptShortcutPanelProps {
  actions: Array<{ label: string }>;
  activeMode: string;
  onApplyMode: (mode: string) => void;
  showCustomAndInspiration: boolean;
  customDraft: string;
  onCustomDraftChange: (value: string) => void;
  customPlaceholder: string;
  onOpenInspiration: () => void;
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
}: PromptShortcutPanelProps) {
  return (
    <>
      <div className="quick-grid">
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
        {showCustomAndInspiration ? (
          <>
            <button
              type="button"
              className={`quick-chip ${activeMode === '自定义' ? 'is-active' : ''}`}
              onClick={() => onApplyMode('自定义')}
            >
              自定义
            </button>
            <button type="button" className="quick-chip" onClick={onOpenInspiration}>
              问题灵感
            </button>
          </>
        ) : null}
      </div>

      {showCustomAndInspiration && activeMode === '自定义' ? (
        <label className="field-card">
          <div className="field-header">
            <span>自定义问题</span>
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

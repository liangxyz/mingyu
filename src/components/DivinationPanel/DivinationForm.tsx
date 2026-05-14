import {
  DIVINATION_METHOD_OPTIONS,
  LIUREN_TEMPLATE_OPTIONS,
  MEIHUA_METHOD_OPTIONS,
  TAROT_SPREAD_OPTIONS,
} from '@/lib/divination/config';
import type { DivinationDraft } from '@/lib/divination/engine';
import {
  liurenTemplateLabelMap,
  meihuaMethodLabelMap,
  methodLabelMap,
  tarotSpreadLabelMap,
} from './constants';

interface DivinationFormProps {
  draft: DivinationDraft;
  updateDraft: <K extends keyof DivinationDraft>(key: K, value: DivinationDraft[K]) => void;
  isSubmitting: boolean;
  error: string;
  onSubmit: () => void | Promise<void>;
  onOpenInspiration: () => void;
  onNavigateToHistory: () => void;
  questionInputRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function DivinationForm({
  draft,
  updateDraft,
  isSubmitting,
  error,
  onSubmit,
  onOpenInspiration,
  onNavigateToHistory,
  questionInputRef,
}: DivinationFormProps) {
  return (
    <>
      <section className="person-section divination-form-card">
        <div className="person-section-head">
          <h2>传统起卦</h2>
          <p>依托传统算法，提供准确卦象。</p>
        </div>

        <div className="divination-method-grid">
          {DIVINATION_METHOD_OPTIONS.map((item) => (
            <button
              key={item.value}
              type="button"
              className={`divination-method-btn ${draft.method === item.value ? 'is-active' : ''}`}
              onClick={() => updateDraft('method', item.value)}
            >
              <strong>{item.label}</strong>
              <span>{item.description}</span>
            </button>
          ))}
        </div>

        <div className="person-info-form">
          <div className="form-row">
            <div className="form-item">
              <label htmlFor="divination-question-input">问题</label>
              <div className="divination-question-field">
                <textarea
                  ref={questionInputRef}
                  id="divination-question-input"
                  rows={5}
                  value={draft.question}
                  className="form-input divination-textarea"
                  placeholder="例如：我现在该主动推进，还是先稳住等待更好的时机？"
                  onChange={(event) => updateDraft('question', event.target.value)}
                />

                <div className="divination-desktop-question-footer">
                  <div className="divination-desktop-question-controls">
                    {draft.method === 'meihua' ? (
                      <div className="form-item divination-inline-field">
                        <label htmlFor="meihua-method-select">起卦方式</label>
                        <div className="divination-select-shell divination-desktop-select-shell">
                          <span className="divination-trigger-text">
                            {meihuaMethodLabelMap[draft.meihuaMethod]}
                          </span>
                          <select
                            id="meihua-method-select"
                            value={draft.meihuaMethod}
                            className="form-input divination-overlay-select"
                            onChange={(event) =>
                              updateDraft(
                                'meihuaMethod',
                                event.target.value as DivinationDraft['meihuaMethod'],
                              )
                            }
                          >
                            {MEIHUA_METHOD_OPTIONS.map((item) => (
                              <option key={item.value} value={item.value}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : null}

                    {draft.method === 'meihua' && draft.meihuaMethod === 'number' ? (
                      <div className="form-item divination-inline-field divination-inline-number-field">
                        <label htmlFor="meihua-number-input">起卦数字</label>
                        <input
                          id="meihua-number-input"
                          type="text"
                          inputMode="numeric"
                          className="form-input"
                          placeholder="例如 123"
                          value={draft.meihuaNumber}
                          onChange={(event) =>
                            updateDraft('meihuaNumber', event.target.value.replace(/[^\d]/g, ''))
                          }
                        />
                      </div>
                    ) : null}

                    {draft.method === 'liuren' ? (
                      <div className="form-item divination-inline-field">
                        <label htmlFor="liuren-template-select">断课模板</label>
                        <div className="divination-select-shell divination-desktop-select-shell">
                          <span className="divination-trigger-text">
                            {liurenTemplateLabelMap[draft.liurenTemplate]}
                          </span>
                          <select
                            id="liuren-template-select"
                            value={draft.liurenTemplate}
                            className="form-input divination-overlay-select"
                            onChange={(event) =>
                              updateDraft(
                                'liurenTemplate',
                                event.target.value as DivinationDraft['liurenTemplate'],
                              )
                            }
                          >
                            {LIUREN_TEMPLATE_OPTIONS.map((item) => (
                              <option key={item.value} value={item.value}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : null}

                    {draft.method === 'tarot' ? (
                      <div className="form-item divination-inline-field">
                        <label htmlFor="tarot-spread-select">牌阵</label>
                        <div className="divination-select-shell divination-desktop-select-shell">
                          <span className="divination-trigger-text">
                            {tarotSpreadLabelMap[draft.tarotSpread]}
                          </span>
                          <select
                            id="tarot-spread-select"
                            value={draft.tarotSpread}
                            className="form-input divination-overlay-select"
                            onChange={(event) =>
                              updateDraft(
                                'tarotSpread',
                                event.target.value as DivinationDraft['tarotSpread'],
                              )
                            }
                          >
                            {TAROT_SPREAD_OPTIONS.map((item) => (
                              <option key={item.value} value={item.value}>
                                {item.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    className="quick-chip divination-desktop-inspiration-btn"
                    onClick={onOpenInspiration}
                  >
                    问题灵感
                  </button>
                </div>
              </div>

              <div
                className={`divination-mobile-control-row ${
                  draft.method === 'meihua' || draft.method === 'liuren' || draft.method === 'tarot'
                    ? 'has-secondary'
                    : ''
                }`}
              >
                <div className="divination-mobile-method-picker">
                  <span className="divination-mobile-trigger-text divination-trigger-text">
                    {methodLabelMap[draft.method]}
                  </span>
                  <select
                    aria-label="占卜类型"
                    value={draft.method}
                    className="form-input divination-mobile-method-select divination-overlay-select"
                    onChange={(event) =>
                      updateDraft('method', event.target.value as DivinationDraft['method'])
                    }
                  >
                    {DIVINATION_METHOD_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>

                {draft.method === 'meihua' ? (
                  <div className="divination-mobile-secondary-picker">
                    <span className="divination-mobile-trigger-text divination-trigger-text">
                      {meihuaMethodLabelMap[draft.meihuaMethod]}
                    </span>
                    <select
                      aria-label="起卦方式"
                      value={draft.meihuaMethod}
                      className="form-input divination-mobile-method-select divination-overlay-select"
                      onChange={(event) =>
                        updateDraft(
                          'meihuaMethod',
                          event.target.value as DivinationDraft['meihuaMethod'],
                        )
                      }
                    >
                      {MEIHUA_METHOD_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {draft.method === 'tarot' ? (
                  <div className="divination-mobile-secondary-picker">
                    <span className="divination-mobile-trigger-text divination-trigger-text">
                      {tarotSpreadLabelMap[draft.tarotSpread]}
                    </span>
                    <select
                      aria-label="牌阵"
                      value={draft.tarotSpread}
                      className="form-input divination-mobile-method-select divination-overlay-select"
                      onChange={(event) =>
                        updateDraft(
                          'tarotSpread',
                          event.target.value as DivinationDraft['tarotSpread'],
                        )
                      }
                    >
                      {TAROT_SPREAD_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {draft.method === 'liuren' ? (
                  <div className="divination-mobile-secondary-picker">
                    <span className="divination-mobile-trigger-text divination-trigger-text">
                      {liurenTemplateLabelMap[draft.liurenTemplate]}
                    </span>
                    <select
                      aria-label="断课模板"
                      value={draft.liurenTemplate}
                      className="form-input divination-mobile-method-select divination-overlay-select"
                      onChange={(event) =>
                        updateDraft(
                          'liurenTemplate',
                          event.target.value as DivinationDraft['liurenTemplate'],
                        )
                      }
                    >
                      {LIUREN_TEMPLATE_OPTIONS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <button
                  type="button"
                  className="quick-chip divination-mobile-inspiration-btn"
                  onClick={onOpenInspiration}
                >
                  问题灵感
                </button>
              </div>
            </div>
          </div>

          {draft.method === 'meihua' && draft.meihuaMethod === 'number' ? (
            <div className="form-row divination-mobile-only">
              <div className="form-item">
                <label htmlFor="meihua-number-input-mobile">起卦数字</label>
                <input
                  id="meihua-number-input-mobile"
                  type="text"
                  inputMode="numeric"
                  className="form-input"
                  placeholder="例如 123"
                  value={draft.meihuaNumber}
                  onChange={(event) =>
                    updateDraft('meihuaNumber', event.target.value.replace(/[^\d]/g, ''))
                  }
                />
              </div>
            </div>
          ) : null}

          <div
            className={`form-row-flex divination-meta-row ${draft.method === 'tarot' ? 'is-single' : ''}`}
          >
            <div className="form-item">
              <label htmlFor="divination-gender-select">性别（可选）</label>
              <select
                id="divination-gender-select"
                value={draft.gender}
                className="form-input"
                onChange={(event) =>
                  updateDraft('gender', event.target.value as DivinationDraft['gender'])
                }
              >
                <option value="">不填</option>
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </div>

            {draft.method !== 'tarot' ? (
              <div className="form-item">
                <label htmlFor="divination-birth-year-input">出生年份（可选）</label>
                <input
                  id="divination-birth-year-input"
                  type="text"
                  inputMode="numeric"
                  className="form-input"
                  placeholder="例如 1998"
                  value={draft.birthYear}
                  onChange={(event) =>
                    updateDraft('birthYear', event.target.value.replace(/[^\d]/g, ''))
                  }
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {error ? <div className="form-error-text global-form-error">{error}</div> : null}

      <div
        className="form-actions page-submit-actions"
        style={{
          width: '100%',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          justifyItems: 'stretch',
        }}
      >
        <button className="secondary-page-button" type="button" onClick={onNavigateToHistory}>
          历史记录
        </button>
        <button
          className="primary-button start-submit-button"
          type="button"
          disabled={isSubmitting}
          onClick={onSubmit}
        >
          开始占卜
        </button>
      </div>
    </>
  );
}

import type { DivinationDraft } from '@/lib/divination/engine';
import type { DivinationSession } from '@/lib/divination/engine';
import type { DivinationSummaryBlocks } from '@/lib/divination/summary';

interface DivinationResultProps {
  isSubmitting: boolean;
  session: DivinationSession | null;
  summary: DivinationSummaryBlocks | null;
  methodLabelMap: Record<DivinationDraft['method'], string>;
  copyState: string;
  shareState: string;
  showShareButton: boolean;
  onCopy: () => void;
  onShare: () => void;
}

export function DivinationResult({
  isSubmitting,
  session,
  summary,
  methodLabelMap,
  copyState,
  shareState,
  showShareButton,
  onCopy,
  onShare,
}: DivinationResultProps) {
  if (isSubmitting) {
    return (
      <div className="workspace-grid divination-output-grid" aria-hidden="true">
        <section className="panel divination-result-panel">
          <div className="divination-result-skeleton">
            <span className="skeleton-block divination-result-skeleton-title" />
            <div className="divination-result-skeleton-tags">
              {Array.from({ length: 4 }, (_, index) => (
                <span
                  className="skeleton-block divination-result-skeleton-tag"
                  key={`tag-${index}`}
                />
              ))}
            </div>
            <div className="divination-result-skeleton-list">
              {Array.from({ length: 4 }, (_, index) => (
                <span
                  className="skeleton-block divination-result-skeleton-line"
                  key={`line-a-${index}`}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="panel divination-result-panel">
          <div className="divination-result-skeleton">
            <span className="skeleton-block divination-result-skeleton-title" />
            <div className="divination-result-skeleton-list">
              {Array.from({ length: 7 }, (_, index) => (
                <span
                  className="skeleton-block divination-result-skeleton-line"
                  key={`line-b-${index}`}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (!session || !summary) {
    return null;
  }

  return (
    <div className="workspace-grid divination-output-grid">
      <section className="panel divination-result-panel">
        <div className="panel-head">
          <div>
            <h2>{summary.title}</h2>
            <p>这部分是本地算法生成的结构化结果，方便你判断本次提示词是否符合预期。</p>
          </div>
        </div>

        {session.requestedMethod === 'random' ? (
          <div className="divination-random-note">本次随机到：{methodLabelMap[session.method]}</div>
        ) : null}

        <div className="divination-tag-cloud">
          {summary.tags.map((item) => (
            <span className="result-soft-tag" key={item}>
              {item}
            </span>
          ))}
        </div>

        <div className="divination-summary-list">
          {summary.lines.filter(Boolean).map((item) => (
            <div className="divination-summary-item" key={item}>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="panel panel-output divination-result-panel">
        <div className="panel-head divination-prompt-head">
          <div>
            <h2>占卜提示词</h2>
            <p>系统要求、结构化结果和你的问题都已经合并，复制整段即可使用。</p>
          </div>
          <div className="action-row compact-actions divination-prompt-actions">
            <button className="copy-button secondary-button" type="button" onClick={onCopy}>
              {copyState}
            </button>
            {showShareButton ? (
              <button className="copy-button" type="button" onClick={onShare}>
                {shareState}
              </button>
            ) : null}
          </div>
        </div>
        <div className="prompt-send-tip">点击复制后，发送到你常用的在线 AI 软件继续提问。</div>

        <pre className="result-pre">{session.prompt}</pre>
      </section>
    </div>
  );
}

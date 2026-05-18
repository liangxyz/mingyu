import type { DivinationDraft } from '@/lib/divination/engine';
import type { DivinationSession } from '@/lib/divination/engine';
import type { DivinationSummaryBlocks } from '@/lib/divination/summary';
import type { AstrolabeData, XiaoliurenData, XiaoliurenPalaceDetail } from '@/types/divination';
import { AstrolabeChart } from '@/components/AstrolabeChart';

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

function XiaoliurenStageCard(props: { label: string; detail: XiaoliurenPalaceDetail }) {
  const { label, detail } = props;

  return (
    <article className="xiaoliuren-stage-card">
      <div className="xiaoliuren-stage-head">
        <span>{label}</span>
        <strong>{detail.name}</strong>
      </div>
      <p>{detail.meaning}</p>
      <div className="xiaoliuren-keyword-row">
        {detail.keywords.map((keyword) => (
          <span className="result-soft-tag" key={`${detail.name}-${keyword}`}>
            {keyword}
          </span>
        ))}
      </div>
      <small>建议：{detail.advice}</small>
    </article>
  );
}

function XiaoliurenBoard({ data }: { data: XiaoliurenData }) {
  return (
    <div className="divination-extra-panel xiaoliuren-board">
      <div className="divination-extra-head">
        <strong>小六壬三段推演</strong>
        <span>
          {data.methodLabel} · {data.hourLabel}
        </span>
      </div>

      <div className="xiaoliuren-card-grid">
        <XiaoliurenStageCard label="起因" detail={data.sequence.start} />
        <XiaoliurenStageCard label="过程" detail={data.sequence.process} />
        <XiaoliurenStageCard label="结果" detail={data.sequence.result} />
      </div>

      <div className="xiaoliuren-overview-grid">
        <div className="xiaoliuren-overview-item">
          <span>主判断</span>
          <strong>{data.primary.name}</strong>
          <p>{data.primary.tendency}</p>
        </div>
        <div className="xiaoliuren-overview-item">
          <span>问事提醒</span>
          <strong>{data.questionHint}</strong>
          <p>适合把这个判断继续交给 AI 展开细拆。</p>
        </div>
      </div>
    </div>
  );
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

        {session.method === 'astrolabe' ? (
          <AstrolabeChart data={session.data as AstrolabeData} />
        ) : null}

        {session.method === 'xiaoliuren' ? (
          <XiaoliurenBoard data={session.data as XiaoliurenData} />
        ) : null}
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

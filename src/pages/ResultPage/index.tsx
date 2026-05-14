import { Suspense, lazy, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  buildCombinedZiweiCompatibilityPrompt,
  buildCombinedZiweiPrompt,
} from '@/lib/full-chart-engine';
import {
  buildResultSearch,
  buildInputSearch,
  parseInputState,
  parsePromptState,
  type PromptSourceKey,
  type QueryPromptState,
  type ResultTabKey,
} from '@/lib/query-state';
import { shouldShowPromptShareButton } from '@/lib/prompt-page-rules';
import { PageTopbar } from '@/components/PageTopbar';
import { QuestionInspirationModal } from '@/components/QuestionInspirationModal';
import { useViewportWidth } from '@/hooks/useViewportWidth';
import { buildUnknownTimeBaziPrompt } from '@/lib/birth-time-reverse';
import { formatBaziForPrompt } from '@/utils/bazi/baziAnalysisFormatter';
import type {
  BaziFortuneSelectionModule,
  InspirationCategory,
  PromptEngineModule,
} from './ResultPage.types';
import { PROMPT_DRAFT_STORAGE_PREFIX } from './ResultPage.constants';
import {
  buildBaziFortuneSelectionValue,
  buildCombinedPromptText,
  buildCompatibilityPromptWithUnknownTime,
  formatZiweiPromptScopeSummary,
  getBaziShortcutActions,
  getZiweiShortcutActions,
  resolveCompatType,
} from './ResultPage.helpers';
import {
  BaziFortuneLoadingModal,
  InlineSkeleton,
  PromptPreSkeleton,
  ZiweiBoardSkeleton,
} from './components/skeletons';
import { usePromptCopyShare } from '@/hooks/usePromptCopyShare';
import { BaziChartBoard } from './components/BaziChartBoard';
import { ThreePillarsBoard } from './components/ThreePillarsBoard';
import { ZiweiBoard } from './components/ZiweiBoard';
import { ZiweiScopeModal } from './components/ZiweiScopeModal';
import { PromptShortcutPanel } from './components/PromptShortcutPanel';
import { useQuestionInspiration } from './hooks/useQuestionInspiration';
import { useBaziCalculations } from './hooks/useBaziCalculations';
import { useZiweiCalculations } from './hooks/useZiweiCalculations';
import { usePromptShortcuts } from './hooks/usePromptShortcuts';

const LazyBaziFortuneModal = lazy(async () => {
  const module = await import('@/components/BaziFortuneTools/BaziFortuneModal');
  return { default: module.BaziFortuneModal };
});

export function ResultPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const inputSearch = useMemo(() => buildInputSearch(searchParams), [searchParams]);
  const inputState = useMemo(
    () => parseInputState(new URLSearchParams(inputSearch)),
    [inputSearch],
  );
  const promptState = useMemo(() => parsePromptState(searchParams), [searchParams]);
  const baziDraftStorageKey = useMemo(
    () => `${PROMPT_DRAFT_STORAGE_PREFIX}:bazi:${inputSearch}`,
    [inputSearch],
  );
  const ziweiDraftStorageKey = useMemo(
    () => `${PROMPT_DRAFT_STORAGE_PREFIX}:ziwei:${inputSearch}`,
    [inputSearch],
  );
  const shouldLoadBaziPromptModules =
    promptState.tab === 'prompt' && promptState.promptSource === 'bazi';
  const [isBaziFortuneModalOpen, setIsBaziFortuneModalOpen] = useState(false);
  const [isZiweiScopeModalOpen, setIsZiweiScopeModalOpen] = useState(false);
  const inspiration = useQuestionInspiration();
  const viewportWidth = useViewportWidth(0);
  const [promptEngine, setPromptEngine] = useState<PromptEngineModule | null>(null);
  const [baziFortuneSelectionModule, setBaziFortuneSelectionModule] =
    useState<BaziFortuneSelectionModule | null>(null);
  const [mountedTabs, setMountedTabs] = useState<Record<ResultTabKey, boolean>>(() => ({
    bazi: promptState.tab === 'bazi',
    ziwei: promptState.tab === 'ziwei',
    prompt: promptState.tab === 'prompt',
  }));
  const {
    baziResult,
    partnerBaziResult,
    baziError,
    primaryThreePillarsState,
    partnerThreePillarsState,
    primaryHasUnknownTime,
    partnerHasUnknownTime,
    hasUnknownBirthTime,
  } = useBaziCalculations(inputState);
  const {
    ziweiRuntime,
    partnerZiweiRuntime,
    ziweiError,
    primaryZiweiInput,
    partnerZiweiInput,
    activeZiweiPayloadByScope,
    currentZiweiPayload,
    partnerZiweiPayload,
  } = useZiweiCalculations(
    inputState,
    promptState,
    mountedTabs.ziwei,
    mountedTabs.prompt,
    primaryHasUnknownTime,
    partnerHasUnknownTime,
  );
  const {
    activeBaziShortcutMode,
    activeZiweiShortcutMode,
    baziQuestionDraft,
    ziweiQuestionDraft,
    setBaziQuestionDraft,
    setZiweiQuestionDraft,
    effectiveBaziQuickQuestion,
    effectiveZiweiQuickQuestion,
    applyBaziShortcutMode,
    applyZiweiShortcutMode,
    applyInspiredQuestion,
  } = usePromptShortcuts(
    inputState,
    promptState,
    baziDraftStorageKey,
    ziweiDraftStorageKey,
    updatePromptState,
    inspiration.close,
  );

  useEffect(() => {
    setMountedTabs((current) => {
      if (current[promptState.tab]) {
        return current;
      }

      return {
        ...current,
        [promptState.tab]: true,
      };
    });
  }, [promptState.tab]);

  useEffect(() => {
    if (!hasUnknownBirthTime || promptState.promptSource !== 'ziwei') {
      return;
    }

    updatePromptState({
      promptSource: 'bazi',
    });
  }, [hasUnknownBirthTime, promptState.promptSource, updatePromptState]);

  useEffect(() => {
    if (
      (shouldLoadBaziPromptModules ? promptEngine : true) &&
      (shouldLoadBaziPromptModules || isBaziFortuneModalOpen ? baziFortuneSelectionModule : true)
    ) {
      return;
    }

    let cancelled = false;

    async function loadPromptModules() {
      const loaders: Array<Promise<void>> = [];

      if (shouldLoadBaziPromptModules && !promptEngine) {
        loaders.push(
          import('@/lib/prompt-engine').then((module) => {
            if (!cancelled) {
              setPromptEngine(module);
            }
          }),
        );
      }

      if ((shouldLoadBaziPromptModules || isBaziFortuneModalOpen) && !baziFortuneSelectionModule) {
        loaders.push(
          import('@/utils/bazi/fortuneSelection').then((module) => {
            if (!cancelled) {
              setBaziFortuneSelectionModule(module);
            }
          }),
        );
      }

      await Promise.all(loaders);
    }

    void loadPromptModules();

    return () => {
      cancelled = true;
    };
  }, [
    baziFortuneSelectionModule,
    isBaziFortuneModalOpen,
    promptEngine,
    shouldLoadBaziPromptModules,
  ]);

  const selectedBaziPreset = useMemo(() => {
    if (!promptEngine) {
      return null;
    }

    const promptList =
      inputState.analysisMode === 'compatibility'
        ? promptEngine.BAZI_AI_PROMPTS.combined
        : promptEngine.BAZI_AI_PROMPTS.single;

    return promptList.find((item) => item.id === promptState.baziPresetId) ?? promptList[0] ?? null;
  }, [inputState.analysisMode, promptEngine, promptState.baziPresetId]);

  const baziFortuneSelection = useMemo(
    () => buildBaziFortuneSelectionValue(promptState),
    [promptState],
  );
  const normalizedBaziFortuneSelection = useMemo(() => {
    if (!baziResult || !baziFortuneSelectionModule) {
      return { scope: 'natal' as const };
    }

    return baziFortuneSelectionModule.normalizeFortuneSelection(baziResult, baziFortuneSelection);
  }, [baziFortuneSelection, baziFortuneSelectionModule, baziResult]);
  const baziFortuneContext = useMemo(() => {
    if (!baziResult || !baziFortuneSelectionModule) {
      return null;
    }

    return baziFortuneSelectionModule.buildFortuneSelectionContext(
      baziResult,
      normalizedBaziFortuneSelection,
    );
  }, [baziFortuneSelectionModule, baziResult, normalizedBaziFortuneSelection]);

  const deferredBaziQuickQuestion = useDeferredValue(effectiveBaziQuickQuestion);
  const deferredZiweiQuickQuestion = useDeferredValue(effectiveZiweiQuickQuestion);

  function computeBaziPromptText(question: string, finalQuestion: string): string {
    if (promptState.tab !== 'prompt') return '';
    if (inputState.analysisMode === 'compatibility') {
      if (primaryHasUnknownTime || partnerHasUnknownTime) {
        const firstText = primaryHasUnknownTime
          ? primaryThreePillarsState.profile?.promptText || ''
          : baziResult
            ? formatBaziForPrompt(baziResult, null, 'compatibility')
            : '';
        const secondText = partnerHasUnknownTime
          ? partnerThreePillarsState.profile?.promptText || ''
          : partnerBaziResult
            ? formatBaziForPrompt(partnerBaziResult, null, 'compatibility')
            : '';

        if (!firstText || !secondText) return '';

        return buildCompatibilityPromptWithUnknownTime({
          firstName: inputState.name || '第一人',
          firstText,
          secondName: inputState.partnerName || '第二人',
          secondText,
          question: question.trim() || '请先从婚恋匹配角度做整体解读。',
        });
      }

      if (!promptEngine || !baziResult || !partnerBaziResult) return '';
      const compatibilityPrompt = promptEngine.getCompatibilityPrompt(
        question.trim() || '请先从婚恋匹配角度做整体解读。',
        baziResult,
        partnerBaziResult,
        resolveCompatType(promptState.baziPresetId),
      );
      return buildCombinedPromptText(compatibilityPrompt.system, compatibilityPrompt.user);
    }
    if (primaryHasUnknownTime) {
      if (!primaryThreePillarsState.profile) return '';
      return buildUnknownTimeBaziPrompt(
        primaryThreePillarsState.profile,
        question.trim() || '请先做整体解读。',
      );
    }
    if (!promptEngine || !baziResult || !baziFortuneSelectionModule || !selectedBaziPreset) {
      return '';
    }
    const { system, user } = promptEngine.buildPromptFromConfig(
      finalQuestion,
      selectedBaziPreset,
      baziResult,
      baziFortuneContext,
    );
    return buildCombinedPromptText(system, user);
  }

  function computeZiweiPromptText(question: string): string {
    if (promptState.tab !== 'prompt') return '';
    if (inputState.analysisMode === 'compatibility') {
      if (!currentZiweiPayload || !partnerZiweiPayload) return '';
      return buildCombinedZiweiCompatibilityPrompt({
        primaryPayload: currentZiweiPayload,
        partnerPayload: partnerZiweiPayload,
        topic: promptState.ziweiTopic,
        question: question || '请先分析双方关系匹配度、互动模式和相处建议。',
      });
    }
    if (!currentZiweiPayload) return '';
    return buildCombinedZiweiPrompt(
      currentZiweiPayload,
      promptState.ziweiTopic,
      question || '请先做整体解读。',
    );
  }

  const finalBaziQuestion = useMemo(() => {
    const question = effectiveBaziQuickQuestion.trim() || '请先做整体解读。';
    if (baziFortuneContext) {
      return `请结合${baziFortuneContext.displayLabel}重点回答：${question}`;
    }
    return question;
  }, [baziFortuneContext, effectiveBaziQuickQuestion]);
  const deferredFinalBaziQuestion = useMemo(() => {
    const question = deferredBaziQuickQuestion.trim() || '请先做整体解读。';
    if (baziFortuneContext) {
      return `请结合${baziFortuneContext.displayLabel}重点回答：${question}`;
    }
    return question;
  }, [baziFortuneContext, deferredBaziQuickQuestion]);

  const latestBaziPromptText = useMemo(
    () => computeBaziPromptText(effectiveBaziQuickQuestion, finalBaziQuestion),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      baziFortuneContext,
      baziFortuneSelectionModule,
      baziResult,
      effectiveBaziQuickQuestion,
      finalBaziQuestion,
      inputState.analysisMode,
      inputState.name,
      inputState.partnerName,
      partnerBaziResult,
      partnerHasUnknownTime,
      partnerThreePillarsState.profile,
      primaryHasUnknownTime,
      primaryThreePillarsState.profile,
      promptEngine,
      promptState.baziPresetId,
      promptState.tab,
      selectedBaziPreset,
    ],
  );
  const previewBaziPromptText = useMemo(
    () => computeBaziPromptText(deferredBaziQuickQuestion, deferredFinalBaziQuestion),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      baziFortuneContext,
      baziFortuneSelectionModule,
      baziResult,
      deferredBaziQuickQuestion,
      deferredFinalBaziQuestion,
      inputState.analysisMode,
      inputState.name,
      inputState.partnerName,
      partnerBaziResult,
      partnerHasUnknownTime,
      partnerThreePillarsState.profile,
      primaryHasUnknownTime,
      primaryThreePillarsState.profile,
      promptEngine,
      promptState.baziPresetId,
      promptState.tab,
      selectedBaziPreset,
    ],
  );

  const latestZiweiPromptText = useMemo(
    () => computeZiweiPromptText(effectiveZiweiQuickQuestion),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      currentZiweiPayload,
      effectiveZiweiQuickQuestion,
      inputState.analysisMode,
      partnerZiweiPayload,
      promptState.tab,
      promptState.ziweiTopic,
    ],
  );
  const previewZiweiPromptText = useMemo(
    () => computeZiweiPromptText(deferredZiweiQuickQuestion),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      currentZiweiPayload,
      deferredZiweiQuickQuestion,
      inputState.analysisMode,
      partnerZiweiPayload,
      promptState.tab,
      promptState.ziweiTopic,
    ],
  );

  const latestActivePromptText =
    promptState.promptSource === 'bazi' ? latestBaziPromptText : latestZiweiPromptText;
  const { copyState, shareState, handleCopy, handleShare } =
    usePromptCopyShare(latestActivePromptText);
  const previewActivePromptText =
    promptState.promptSource === 'bazi' ? previewBaziPromptText : previewZiweiPromptText;
  const isBaziFortuneSummaryLoading = shouldLoadBaziPromptModules && !baziFortuneSelectionModule;
  const baziFortuneSummaryText = baziFortuneContext?.displayText ?? '仅使用本命信息';
  const ziweiScopeSummaryText =
    promptState.ziweiScope === 'origin'
      ? '仅使用本命信息'
      : formatZiweiPromptScopeSummary(
          promptState.ziweiScope,
          promptState.ziweiScopeDate,
          promptState.ziweiScopeDate ? currentZiweiPayload?.active_scope.label : undefined,
        );
  const showShareButton = shouldShowPromptShareButton({
    viewportWidth,
    hasNavigatorShare: typeof navigator !== 'undefined' && typeof navigator.share === 'function',
  });
  const updatePromptState = useCallback(
    (next: Partial<QueryPromptState>) => {
      const merged = {
        ...promptState,
        ...next,
      };
      setSearchParams(buildResultSearch(inputState, merged), { replace: true });
    },
    [inputState, promptState, setSearchParams],
  );

  function switchTab(tab: ResultTabKey) {
    updatePromptState({ tab });
  }

  return (
    <div className="page-shell">
      <PageTopbar
        title="排盘结果"
        wide
        onBack={() =>
          navigate(
            `/?mode=${inputState.analysisMode === 'compatibility' ? 'compatibility' : 'single'}`,
          )
        }
      />

      <div className="tab-strip">
        <button
          type="button"
          className={`tab-chip ${promptState.tab === 'bazi' ? 'is-active' : ''}`}
          onClick={() => switchTab('bazi')}
        >
          八字
        </button>
        <button
          type="button"
          className={`tab-chip ${promptState.tab === 'ziwei' ? 'is-active' : ''}`}
          onClick={() => switchTab('ziwei')}
        >
          紫薇
        </button>
        <button
          type="button"
          className={`tab-chip ${promptState.tab === 'prompt' ? 'is-active' : ''}`}
          onClick={() => switchTab('prompt')}
        >
          提示词
        </button>
      </div>

      <div className="result-tab-stage">
        <div
          className={`result-tab-pane ${promptState.tab === 'bazi' ? 'is-active' : 'is-inactive'}`}
          aria-hidden={promptState.tab !== 'bazi'}
        >
          {mountedTabs.bazi ? (
            <div className="single-panel-shell">
              <section className="panel result-panel result-panel-bazi">
                {baziError ? <p className="error-text">{baziError}</p> : null}
                {inputState.analysisMode === 'compatibility' ? (
                  <div className="result-dual-layout">
                    {baziResult ? (
                      <BaziChartBoard
                        title="第一人八字"
                        name={inputState.name || '第一人'}
                        result={baziResult}
                      />
                    ) : primaryThreePillarsState.profile ? (
                      <ThreePillarsBoard
                        title="第一人三柱"
                        name={inputState.name || '第一人'}
                        profile={primaryThreePillarsState.profile}
                      />
                    ) : null}
                    {partnerBaziResult ? (
                      <BaziChartBoard
                        title="第二人八字"
                        name={inputState.partnerName || '第二人'}
                        result={partnerBaziResult}
                      />
                    ) : partnerThreePillarsState.profile ? (
                      <ThreePillarsBoard
                        title="第二人三柱"
                        name={inputState.partnerName || '第二人'}
                        profile={partnerThreePillarsState.profile}
                      />
                    ) : null}
                  </div>
                ) : baziResult ? (
                  <BaziChartBoard
                    title="八字总览"
                    name={inputState.name || '当前命盘'}
                    result={baziResult}
                  />
                ) : primaryThreePillarsState.profile ? (
                  <ThreePillarsBoard
                    title="三柱总览"
                    name={inputState.name || '当前命盘'}
                    profile={primaryThreePillarsState.profile}
                  />
                ) : null}
              </section>
            </div>
          ) : null}
        </div>

        <div
          className={`result-tab-pane ${promptState.tab === 'ziwei' ? 'is-active' : 'is-inactive'}`}
          aria-hidden={promptState.tab !== 'ziwei'}
        >
          {mountedTabs.ziwei ? (
            <div className="single-panel-shell">
              <section className="panel result-panel result-panel-ziwei">
                {ziweiError ? <p className="error-text">{ziweiError}</p> : null}
                {hasUnknownBirthTime ? (
                  <div className="prompt-send-tip">
                    当前存在未知时辰。紫微排盘必须先确定出生时辰，请先使用“反推时辰”确认后再看紫微结果。
                  </div>
                ) : null}
                {inputState.analysisMode === 'compatibility' &&
                currentZiweiPayload &&
                partnerZiweiPayload ? (
                  <div className="result-dual-layout">
                    {ziweiRuntime && primaryZiweiInput ? (
                      <ZiweiBoard
                        title="第一人紫微"
                        name={inputState.name || '第一人'}
                        payload={currentZiweiPayload}
                        chartInput={primaryZiweiInput}
                        runtime={ziweiRuntime}
                      />
                    ) : (
                      <ZiweiBoardSkeleton title="第一人紫微" name={inputState.name || '第一人'} />
                    )}
                    {partnerZiweiRuntime && partnerZiweiInput ? (
                      <ZiweiBoard
                        title="第二人紫微"
                        name={inputState.partnerName || '第二人'}
                        payload={partnerZiweiPayload}
                        chartInput={partnerZiweiInput}
                        runtime={partnerZiweiRuntime}
                      />
                    ) : (
                      <ZiweiBoardSkeleton
                        title="第二人紫微"
                        name={inputState.partnerName || '第二人'}
                      />
                    )}
                  </div>
                ) : null}
                {inputState.analysisMode !== 'compatibility' && currentZiweiPayload ? (
                  ziweiRuntime && primaryZiweiInput ? (
                    <ZiweiBoard
                      title="紫微总览"
                      name={inputState.name || '当前命盘'}
                      payload={currentZiweiPayload}
                      chartInput={primaryZiweiInput}
                      runtime={ziweiRuntime}
                    />
                  ) : (
                    <ZiweiBoardSkeleton title="紫微总览" name={inputState.name || '当前命盘'} />
                  )
                ) : null}
              </section>
            </div>
          ) : null}
        </div>

        <div
          className={`result-tab-pane ${promptState.tab === 'prompt' ? 'is-active' : 'is-inactive'}`}
          aria-hidden={promptState.tab !== 'prompt'}
        >
          {mountedTabs.prompt ? (
            <div className="workspace-grid">
              <section className="panel">
                <div className="panel-head">
                  <div>
                    <h2 className="prompt-settings-title">提示词设置</h2>
                    <p>选择基于八字或紫微，再用快捷按钮生成问题。</p>
                  </div>
                </div>

                <div className="field-list">
                  <div className="prompt-compact-grid">
                    <label className="field-card">
                      <div className="field-header">
                        <span className="prompt-source-title">提示词来源</span>
                      </div>
                      <select
                        value={promptState.promptSource}
                        onChange={(event) =>
                          updatePromptState({
                            promptSource: event.target.value as PromptSourceKey,
                          })
                        }
                      >
                        <option value="bazi">基于八字</option>
                        <option value="ziwei" disabled={hasUnknownBirthTime}>
                          {hasUnknownBirthTime ? '基于紫微（未知时辰不可用）' : '基于紫微'}
                        </option>
                      </select>
                    </label>

                    {promptState.promptSource === 'bazi' &&
                    inputState.analysisMode === 'single' &&
                    !primaryHasUnknownTime ? (
                      <div className="field-card">
                        <div className="field-header">
                          <span>年限选择</span>
                        </div>
                        <button
                          type="button"
                          className="place-trigger"
                          onClick={() => setIsBaziFortuneModalOpen(true)}
                        >
                          {isBaziFortuneSummaryLoading ? (
                            <InlineSkeleton className="inline-skeleton inline-skeleton-medium" />
                          ) : (
                            <span>{baziFortuneSummaryText}</span>
                          )}
                        </button>
                      </div>
                    ) : null}

                    {promptState.promptSource === 'ziwei' ? (
                      <div className="field-card">
                        <div className="field-header">
                          <span>年限选择</span>
                        </div>
                        <button
                          type="button"
                          className="place-trigger"
                          onClick={() => setIsZiweiScopeModalOpen(true)}
                          disabled={!primaryZiweiInput || !activeZiweiPayloadByScope}
                        >
                          {!primaryZiweiInput || !activeZiweiPayloadByScope ? (
                            <InlineSkeleton className="inline-skeleton inline-skeleton-medium" />
                          ) : (
                            <span>{ziweiScopeSummaryText}</span>
                          )}
                        </button>
                      </div>
                    ) : null}
                  </div>

                  {promptState.promptSource === 'bazi' ? (
                    <PromptShortcutPanel
                      actions={getBaziShortcutActions(inputState.analysisMode)}
                      activeMode={activeBaziShortcutMode}
                      onApplyMode={applyBaziShortcutMode}
                      showCustomAndInspiration={inputState.analysisMode === 'single'}
                      customDraft={baziQuestionDraft}
                      onCustomDraftChange={setBaziQuestionDraft}
                      customPlaceholder="例如：我近期适合换工作还是稳住？"
                      onOpenInspiration={inspiration.open}
                    />
                  ) : null}

                  {promptState.promptSource === 'ziwei' ? (
                    <PromptShortcutPanel
                      actions={getZiweiShortcutActions(inputState.analysisMode)}
                      activeMode={activeZiweiShortcutMode}
                      onApplyMode={applyZiweiShortcutMode}
                      showCustomAndInspiration={inputState.analysisMode === 'single'}
                      customDraft={ziweiQuestionDraft}
                      onCustomDraftChange={setZiweiQuestionDraft}
                      customPlaceholder="例如：请重点分析我这段时间该主动还是先稳住。"
                      onOpenInspiration={inspiration.open}
                    />
                  ) : null}
                </div>
              </section>

              <section className="panel panel-output">
                <div className="panel-head">
                  <div>
                    <h2>提示词正文</h2>
                    <p>系统要求和问题正文已合并，复制这一整段提示词即可。</p>
                  </div>
                  <div className="action-row compact-actions">
                    <button
                      className="copy-button secondary-button"
                      type="button"
                      onClick={handleCopy}
                    >
                      {copyState}
                    </button>
                    {showShareButton ? (
                      <button className="copy-button" type="button" onClick={handleShare}>
                        {shareState}
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="prompt-send-tip">
                  点击复制后，发送到你常用的在线 AI 软件继续提问。
                </div>
                {hasUnknownBirthTime && promptState.promptSource === 'bazi' ? (
                  <div className="prompt-send-tip">
                    当前存在未知时辰，已自动改为三柱保守提示词，不会假定时柱。
                  </div>
                ) : null}
                {previewActivePromptText ? (
                  <pre className="result-pre">{previewActivePromptText}</pre>
                ) : (
                  <PromptPreSkeleton />
                )}
              </section>
            </div>
          ) : null}
        </div>
      </div>

      {isBaziFortuneModalOpen && baziResult && inputState.analysisMode === 'single' ? (
        <Suspense fallback={<BaziFortuneLoadingModal />}>
          <LazyBaziFortuneModal
            result={baziResult}
            selection={baziFortuneSelection}
            onClose={() => setIsBaziFortuneModalOpen(false)}
            onApply={(next) =>
              updatePromptState({
                baziFortuneScope: next.scope,
                baziFortuneCycleIndex: next.scope === 'natal' ? '' : String(next.cycleIndex ?? ''),
                baziFortuneYear: next.scope === 'natal' ? '' : String(next.year ?? ''),
                baziFortuneMonth:
                  next.scope === 'month' || next.scope === 'day' ? String(next.month ?? '') : '',
                baziFortuneDay: next.scope === 'day' ? String(next.day ?? '') : '',
              })
            }
          />
        </Suspense>
      ) : null}

      {isZiweiScopeModalOpen && primaryZiweiInput && activeZiweiPayloadByScope ? (
        <ZiweiScopeModal
          chartInput={primaryZiweiInput}
          payloadByScope={activeZiweiPayloadByScope}
          selectedScope={promptState.ziweiScope}
          selectedDateStr={promptState.ziweiScopeDate}
          onClose={() => setIsZiweiScopeModalOpen(false)}
          onApply={(scope, dateStr) =>
            updatePromptState({
              ziweiScope: scope,
              ziweiScopeDate: scope === 'origin' ? '' : dateStr,
            })
          }
        />
      ) : null}

      {inspiration.isOpen && inputState.analysisMode === 'single' ? (
        <QuestionInspirationModal
          filters={inspiration.inspirationFilters}
          activeFilter={inspiration.activeCategory}
          onFilterChange={(value) => inspiration.setActiveCategory(value as InspirationCategory)}
          searchValue={inspiration.search}
          onSearchChange={inspiration.setSearch}
          sections={inspiration.filteredSections}
          emptyText="没有找到匹配的问题，请换个关键词或分类。"
          onSelect={applyInspiredQuestion}
          onClose={inspiration.close}
        />
      ) : null}
    </div>
  );
}

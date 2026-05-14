import { useEffect, useMemo, useState } from 'react';
import type { QueryInputState, QueryPromptState } from '@/lib/query-state';
import { buildBaziCustomPromptPatch, buildZiweiCustomPromptPatch } from '@/lib/prompt-page-rules';
import {
  findBaziShortcutByMode,
  findZiweiShortcutByMode,
  readPromptDraft,
  resolveBaziShortcutMode,
  resolveZiweiShortcutMode,
  writePromptDraft,
} from '../ResultPage.helpers';
import type { PromptShortcutMode } from '../ResultPage.types';

export interface PromptShortcuts {
  activeBaziShortcutMode: PromptShortcutMode;
  activeZiweiShortcutMode: PromptShortcutMode;
  baziQuestionDraft: string;
  ziweiQuestionDraft: string;
  setBaziQuestionDraft: (value: string) => void;
  setZiweiQuestionDraft: (value: string) => void;
  effectiveBaziQuickQuestion: string;
  effectiveZiweiQuickQuestion: string;
  applyBaziShortcutMode: (mode: PromptShortcutMode) => void;
  applyZiweiShortcutMode: (mode: PromptShortcutMode) => void;
  applyInspiredQuestion: (question: string) => void;
}

export function usePromptShortcuts(
  inputState: QueryInputState,
  promptState: QueryPromptState,
  baziDraftStorageKey: string,
  ziweiDraftStorageKey: string,
  onUpdatePromptState: (next: Partial<QueryPromptState>) => void,
  onCloseInspiration: () => void,
): PromptShortcuts {
  const [activeBaziShortcutMode, setActiveBaziShortcutMode] = useState<PromptShortcutMode>(() =>
    resolveBaziShortcutMode(promptState, inputState.analysisMode),
  );
  const [activeZiweiShortcutMode, setActiveZiweiShortcutMode] = useState<PromptShortcutMode>(() =>
    resolveZiweiShortcutMode(promptState, inputState.analysisMode),
  );
  const [baziQuestionDraft, setBaziQuestionDraft] = useState(() => {
    const mode = resolveBaziShortcutMode(promptState, inputState.analysisMode);
    return (
      readPromptDraft(baziDraftStorageKey) ||
      promptState.baziQuickQuestion ||
      findBaziShortcutByMode(mode, inputState.analysisMode)?.question ||
      ''
    );
  });
  const [ziweiQuestionDraft, setZiweiQuestionDraft] = useState(() => {
    const mode = resolveZiweiShortcutMode(promptState, inputState.analysisMode);
    return (
      readPromptDraft(ziweiDraftStorageKey) ||
      promptState.ziweiQuickQuestion ||
      findZiweiShortcutByMode(mode, inputState.analysisMode)?.question ||
      ''
    );
  });

  useEffect(() => {
    const nextMode = resolveBaziShortcutMode(promptState, inputState.analysisMode);
    setActiveBaziShortcutMode(nextMode);
    if (nextMode === '自定义') {
      setBaziQuestionDraft(readPromptDraft(baziDraftStorageKey));
      return;
    }

    setBaziQuestionDraft(findBaziShortcutByMode(nextMode, inputState.analysisMode)?.question ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    baziDraftStorageKey,
    inputState.analysisMode,
    promptState.baziPresetId,
    promptState.baziShortcutMode,
    promptState.baziQuickQuestion,
  ]);

  useEffect(() => {
    const nextMode = resolveZiweiShortcutMode(promptState, inputState.analysisMode);
    setActiveZiweiShortcutMode(nextMode);
    if (nextMode === '自定义') {
      setZiweiQuestionDraft(readPromptDraft(ziweiDraftStorageKey));
      return;
    }

    setZiweiQuestionDraft(
      findZiweiShortcutByMode(nextMode, inputState.analysisMode)?.question ?? '',
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    inputState.analysisMode,
    promptState.ziweiQuickQuestion,
    promptState.ziweiShortcutMode,
    promptState.ziweiTopic,
    ziweiDraftStorageKey,
  ]);

  useEffect(() => {
    if (activeBaziShortcutMode !== '自定义') {
      return;
    }

    writePromptDraft(baziDraftStorageKey, baziQuestionDraft);
  }, [activeBaziShortcutMode, baziDraftStorageKey, baziQuestionDraft]);

  useEffect(() => {
    if (activeZiweiShortcutMode !== '自定义') {
      return;
    }

    writePromptDraft(ziweiDraftStorageKey, ziweiQuestionDraft);
  }, [activeZiweiShortcutMode, ziweiDraftStorageKey, ziweiQuestionDraft]);

  const effectiveBaziQuickQuestion = useMemo(() => {
    if (activeBaziShortcutMode === '自定义') {
      return baziQuestionDraft;
    }
    return findBaziShortcutByMode(activeBaziShortcutMode, inputState.analysisMode)?.question || '';
  }, [activeBaziShortcutMode, baziQuestionDraft, inputState.analysisMode]);

  const effectiveZiweiQuickQuestion = useMemo(() => {
    if (activeZiweiShortcutMode === '自定义') {
      return ziweiQuestionDraft;
    }
    return (
      findZiweiShortcutByMode(activeZiweiShortcutMode, inputState.analysisMode)?.question || ''
    );
  }, [activeZiweiShortcutMode, inputState.analysisMode, ziweiQuestionDraft]);

  function applyBaziShortcutMode(mode: PromptShortcutMode) {
    setActiveBaziShortcutMode(mode);
    if (mode === '自定义') {
      setBaziQuestionDraft('');
      onUpdatePromptState(buildBaziCustomPromptPatch());
      return;
    }

    const matched = findBaziShortcutByMode(mode, inputState.analysisMode);
    if (!matched) {
      return;
    }

    setBaziQuestionDraft(matched.question);
    onUpdatePromptState({
      baziShortcutMode: mode,
      baziPresetId: matched.promptId,
    });
  }

  function applyZiweiShortcutMode(mode: PromptShortcutMode) {
    setActiveZiweiShortcutMode(mode);
    if (mode === '自定义') {
      setZiweiQuestionDraft('');
      onUpdatePromptState(buildZiweiCustomPromptPatch());
      return;
    }

    const matched = findZiweiShortcutByMode(mode, inputState.analysisMode);
    if (!matched) {
      return;
    }

    setZiweiQuestionDraft(matched.question);
    onUpdatePromptState({
      ziweiShortcutMode: mode,
      ziweiTopic: matched.topic,
    });
  }

  function applyInspiredQuestion(question: string) {
    if (promptState.promptSource === 'bazi') {
      setActiveBaziShortcutMode('自定义');
      setBaziQuestionDraft(question);
      onUpdatePromptState({
        baziShortcutMode: '自定义',
        baziPresetId: 'ai-mingge-zonglun',
      });
    } else {
      setActiveZiweiShortcutMode('自定义');
      setZiweiQuestionDraft(question);
      onUpdatePromptState({
        ziweiShortcutMode: '自定义',
        ziweiTopic: 'chat',
      });
    }

    onCloseInspiration();
  }

  return {
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
  };
}

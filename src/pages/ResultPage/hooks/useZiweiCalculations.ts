import { useEffect, useMemo, useRef, useState } from 'react';
import { buildZiweiChartInput, calculateFullZiweiChart } from '@/lib/full-chart-engine';
import { getDefaultHoroscopeContext } from '@/lib/iztro/runtime-helpers';
import type { AnalysisPayloadV1 } from '@/types/analysis';
import type { ScopeType } from '@/types/analysis';
import type { ChartInput } from '@/types/chart';
import type { QueryInputState } from '@/lib/query-state';
import { createDisplayWorker } from '../utils/createDisplayWorker';
import { createPayloadWorker } from '../utils/createPayloadWorker';
import type { ZiweiPayloadByScopeState, ZiweiRuntimeState } from '../ResultPage.types';

async function runZiweiMainThread(
  input: ChartInput,
  onSuccess: (runtime: NonNullable<ZiweiRuntimeState>) => void,
  onError: (message: string) => void,
): Promise<void> {
  try {
    const runtime = await calculateFullZiweiChart(input);
    onSuccess(runtime);
  } catch (error) {
    onError(error instanceof Error ? error.message : '紫微排盘失败。');
  }
}

export interface ZiweiCalculations {
  ziweiRuntime: ZiweiRuntimeState;
  partnerZiweiRuntime: ZiweiRuntimeState;
  ziweiPayloadByScope: ZiweiPayloadByScopeState;
  partnerZiweiPayloadByScope: ZiweiPayloadByScopeState;
  promptZiweiPayload: AnalysisPayloadV1 | null;
  promptPartnerZiweiPayload: AnalysisPayloadV1 | null;
  ziweiError: string;
  primaryZiweiInput: ChartInput | null;
  partnerZiweiInput: ChartInput | null;
  activeZiweiPayloadByScope: ZiweiPayloadByScopeState;
  activePartnerZiweiPayloadByScope: ZiweiPayloadByScopeState;
  currentZiweiPayload: AnalysisPayloadV1 | null;
  partnerZiweiPayload: AnalysisPayloadV1 | null;
}

export function useZiweiCalculations(
  inputState: QueryInputState,
  promptState: {
    tab: string;
    promptSource: string;
    ziweiScope: string;
    ziweiScopeDate: string;
  },
  isZiweiTabMounted: boolean,
  isPromptTabMounted: boolean,
  primaryHasUnknownTime: boolean,
  partnerHasUnknownTime: boolean,
): ZiweiCalculations {
  const [ziweiRuntime, setZiweiRuntime] = useState<ZiweiRuntimeState>(null);
  const [partnerZiweiRuntime, setPartnerZiweiRuntime] = useState<ZiweiRuntimeState>(null);
  const [ziweiPayloadByScope, setZiweiPayloadByScope] = useState<ZiweiPayloadByScopeState>(null);
  const [partnerZiweiPayloadByScope, setPartnerZiweiPayloadByScope] =
    useState<ZiweiPayloadByScopeState>(null);
  const [promptZiweiPayload, setPromptZiweiPayload] = useState<AnalysisPayloadV1 | null>(null);
  const [promptPartnerZiweiPayload, setPromptPartnerZiweiPayload] =
    useState<AnalysisPayloadV1 | null>(null);
  const [ziweiError, setZiweiError] = useState('');
  const primaryRuntimeKeyRef = useRef('');
  const partnerRuntimeKeyRef = useRef('');
  const primaryPayloadKeyRef = useRef('');
  const partnerPayloadKeyRef = useRef('');

  const primaryZiweiInput = useMemo(() => {
    if (primaryHasUnknownTime) {
      return null;
    }

    try {
      return buildZiweiChartInput(inputState);
    } catch {
      return null;
    }
  }, [inputState, primaryHasUnknownTime]);

  const partnerZiweiInput = useMemo(() => {
    if (inputState.analysisMode !== 'compatibility') {
      return null;
    }

    if (partnerHasUnknownTime) {
      return null;
    }

    try {
      return buildZiweiChartInput({
        name: inputState.partnerName,
        gender: inputState.partnerGender,
        dateType: inputState.partnerDateType,
        year: inputState.partnerYear,
        month: inputState.partnerMonth,
        day: inputState.partnerDay,
        timeIndex: inputState.partnerTimeIndex,
        isLeapMonth: inputState.partnerIsLeapMonth,
        useTrueSolarTime: inputState.partnerUseTrueSolarTime,
        birthHour: inputState.partnerBirthHour,
        birthMinute: inputState.partnerBirthMinute,
        birthLongitude: inputState.partnerBirthLongitude,
      });
    } catch {
      return null;
    }
  }, [inputState, partnerHasUnknownTime]);

  const shouldLoadZiweiPromptPayload = isPromptTabMounted && promptState.promptSource === 'ziwei';
  const shouldWarmZiweiRuntime = Boolean(primaryZiweiInput);
  const shouldWarmPartnerZiweiRuntime =
    inputState.analysisMode === 'compatibility' && Boolean(partnerZiweiInput);
  const primaryZiweiInputKey = useMemo(
    () => (primaryZiweiInput ? JSON.stringify(primaryZiweiInput) : ''),
    [primaryZiweiInput],
  );
  const partnerZiweiInputKey = useMemo(
    () => (partnerZiweiInput ? JSON.stringify(partnerZiweiInput) : ''),
    [partnerZiweiInput],
  );

  useEffect(() => {
    if (!primaryZiweiInput) {
      setZiweiPayloadByScope(null);
      primaryPayloadKeyRef.current = '';
      return;
    }

    if (!shouldLoadZiweiPromptPayload) {
      return;
    }

    if (primaryPayloadKeyRef.current === primaryZiweiInputKey && ziweiPayloadByScope) {
      return;
    }

    return createPayloadWorker(
      primaryZiweiInput,
      `${Date.now()}-primary`,
      (payloadByScope) => {
        setZiweiPayloadByScope(payloadByScope);
        primaryPayloadKeyRef.current = primaryZiweiInputKey;
        setZiweiError('');
      },
      (message) => {
        setZiweiPayloadByScope((current) => current);
        setZiweiError(message);
      },
      '紫微排盘失败。',
    );
  }, [primaryZiweiInput, primaryZiweiInputKey, shouldLoadZiweiPromptPayload, ziweiPayloadByScope]);

  useEffect(() => {
    if (!partnerZiweiInput) {
      setPartnerZiweiPayloadByScope(null);
      partnerPayloadKeyRef.current = '';
      return;
    }

    if (!shouldLoadZiweiPromptPayload) {
      return;
    }

    if (partnerPayloadKeyRef.current === partnerZiweiInputKey && partnerZiweiPayloadByScope) {
      return;
    }

    return createPayloadWorker(
      partnerZiweiInput,
      `${Date.now()}-partner`,
      (payloadByScope) => {
        setPartnerZiweiPayloadByScope(payloadByScope);
        partnerPayloadKeyRef.current = partnerZiweiInputKey;
        setZiweiError('');
      },
      (message) => {
        setPartnerZiweiPayloadByScope((current) => current);
        setZiweiError(message);
      },
      '第二人紫微排盘失败。',
    );
  }, [
    partnerZiweiInput,
    partnerZiweiInputKey,
    partnerZiweiPayloadByScope,
    shouldLoadZiweiPromptPayload,
  ]);

  useEffect(() => {
    if (!shouldWarmZiweiRuntime || !primaryZiweiInput) {
      setZiweiRuntime(null);
      primaryRuntimeKeyRef.current = '';
      return;
    }

    if (primaryRuntimeKeyRef.current === primaryZiweiInputKey && ziweiRuntime) {
      return;
    }

    let cancelled = false;

    void runZiweiMainThread(
      primaryZiweiInput,
      (runtime) => {
        if (!cancelled) {
          setZiweiRuntime(runtime);
          setZiweiPayloadByScope(runtime.payloadByScope);
          primaryRuntimeKeyRef.current = primaryZiweiInputKey;
          primaryPayloadKeyRef.current = primaryZiweiInputKey;
          setZiweiError('');
        }
      },
      (message) => {
        if (!cancelled) {
          setZiweiRuntime((current) => current);
          setZiweiError(message);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [primaryZiweiInput, primaryZiweiInputKey, shouldWarmZiweiRuntime, ziweiRuntime]);

  useEffect(() => {
    if (!shouldWarmPartnerZiweiRuntime || !partnerZiweiInput) {
      setPartnerZiweiRuntime(null);
      partnerRuntimeKeyRef.current = '';
      return;
    }

    if (partnerRuntimeKeyRef.current === partnerZiweiInputKey && partnerZiweiRuntime) {
      return;
    }

    let cancelled = false;

    void runZiweiMainThread(
      partnerZiweiInput,
      (runtime) => {
        if (!cancelled) {
          setPartnerZiweiRuntime(runtime);
          setPartnerZiweiPayloadByScope(runtime.payloadByScope);
          partnerRuntimeKeyRef.current = partnerZiweiInputKey;
          partnerPayloadKeyRef.current = partnerZiweiInputKey;
          setZiweiError('');
        }
      },
      (message) => {
        if (!cancelled) {
          setPartnerZiweiRuntime((current) => current);
          setZiweiError(message);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [partnerZiweiInput, partnerZiweiInputKey, partnerZiweiRuntime, shouldWarmPartnerZiweiRuntime]);

  const ziweiPromptScopeType = promptState.ziweiScope as ScopeType;
  const shouldUseCustomZiweiPromptPayload =
    promptState.tab === 'prompt' &&
    promptState.promptSource === 'ziwei' &&
    Boolean(promptState.ziweiScopeDate);

  useEffect(() => {
    if (!shouldUseCustomZiweiPromptPayload || !primaryZiweiInput || !promptState.ziweiScopeDate) {
      setPromptZiweiPayload(null);
      return;
    }

    const { hourIndex } = getDefaultHoroscopeContext();
    const requestId = `prompt-primary-${ziweiPromptScopeType}-${promptState.ziweiScopeDate}-${Date.now()}`;

    return createDisplayWorker(
      {
        id: requestId,
        input: primaryZiweiInput,
        dateStr: promptState.ziweiScopeDate,
        hourIndex,
        scope: ziweiPromptScopeType,
      },
      (payload) => setPromptZiweiPayload(payload),
      () => setPromptZiweiPayload(null),
    );
  }, [
    primaryZiweiInput,
    promptState.promptSource,
    promptState.tab,
    promptState.ziweiScopeDate,
    shouldUseCustomZiweiPromptPayload,
    ziweiPromptScopeType,
  ]);

  useEffect(() => {
    if (
      !shouldUseCustomZiweiPromptPayload ||
      inputState.analysisMode !== 'compatibility' ||
      !partnerZiweiInput ||
      !promptState.ziweiScopeDate
    ) {
      setPromptPartnerZiweiPayload(null);
      return;
    }

    const { hourIndex } = getDefaultHoroscopeContext();
    const requestId = `prompt-partner-${ziweiPromptScopeType}-${promptState.ziweiScopeDate}-${Date.now()}`;

    return createDisplayWorker(
      {
        id: requestId,
        input: partnerZiweiInput,
        dateStr: promptState.ziweiScopeDate,
        hourIndex,
        scope: ziweiPromptScopeType,
      },
      (payload) => setPromptPartnerZiweiPayload(payload),
      () => setPromptPartnerZiweiPayload(null),
    );
  }, [
    inputState.analysisMode,
    partnerZiweiInput,
    promptState.promptSource,
    promptState.tab,
    promptState.ziweiScopeDate,
    shouldUseCustomZiweiPromptPayload,
    ziweiPromptScopeType,
  ]);

  const activeZiweiPayloadByScope = ziweiRuntime?.payloadByScope ?? ziweiPayloadByScope;
  const activePartnerZiweiPayloadByScope =
    partnerZiweiRuntime?.payloadByScope ?? partnerZiweiPayloadByScope;

  const defaultZiweiPayload = useMemo(() => {
    if (!activeZiweiPayloadByScope) return null;
    return activeZiweiPayloadByScope[ziweiPromptScopeType];
  }, [activeZiweiPayloadByScope, ziweiPromptScopeType]);

  const defaultPartnerZiweiPayload = useMemo(() => {
    if (!activePartnerZiweiPayloadByScope) return null;
    return activePartnerZiweiPayloadByScope[ziweiPromptScopeType];
  }, [activePartnerZiweiPayloadByScope, ziweiPromptScopeType]);

  const currentZiweiPayload = promptZiweiPayload ?? defaultZiweiPayload;
  const partnerZiweiPayload = promptPartnerZiweiPayload ?? defaultPartnerZiweiPayload;

  return {
    ziweiRuntime,
    partnerZiweiRuntime,
    ziweiPayloadByScope,
    partnerZiweiPayloadByScope,
    promptZiweiPayload,
    promptPartnerZiweiPayload,
    ziweiError,
    primaryZiweiInput,
    partnerZiweiInput,
    activeZiweiPayloadByScope,
    activePartnerZiweiPayloadByScope,
    currentZiweiPayload,
    partnerZiweiPayload,
  };
}

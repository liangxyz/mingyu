import { useEffect, useMemo, useState } from 'react';
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
  onSuccess: (runtime: ZiweiRuntimeState) => void,
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

  useEffect(() => {
    if (!shouldLoadZiweiPromptPayload || !primaryZiweiInput) {
      return;
    }

    setZiweiPayloadByScope(null);

    return createPayloadWorker(
      primaryZiweiInput,
      `${Date.now()}-primary`,
      (payloadByScope) => {
        setZiweiPayloadByScope(payloadByScope);
        setZiweiError('');
      },
      (message) => {
        setZiweiPayloadByScope(null);
        setZiweiError(message);
      },
      '紫微排盘失败。',
    );
  }, [primaryZiweiInput, shouldLoadZiweiPromptPayload]);

  useEffect(() => {
    if (!shouldLoadZiweiPromptPayload || !partnerZiweiInput) {
      return;
    }

    setPartnerZiweiPayloadByScope(null);

    return createPayloadWorker(
      partnerZiweiInput,
      `${Date.now()}-partner`,
      (payloadByScope) => {
        setPartnerZiweiPayloadByScope(payloadByScope);
        setZiweiError('');
      },
      (message) => {
        setPartnerZiweiPayloadByScope(null);
        setZiweiError(message);
      },
      '第二人紫微排盘失败。',
    );
  }, [partnerZiweiInput, shouldLoadZiweiPromptPayload]);

  useEffect(() => {
    if (!isZiweiTabMounted || !primaryZiweiInput) {
      return;
    }

    let cancelled = false;

    void runZiweiMainThread(
      primaryZiweiInput,
      (runtime) => {
        if (!cancelled) {
          setZiweiRuntime(runtime);
          setZiweiPayloadByScope(runtime.payloadByScope);
          setZiweiError('');
        }
      },
      (message) => {
        if (!cancelled) {
          setZiweiRuntime(null);
          setZiweiError(message);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [isZiweiTabMounted, primaryZiweiInput]);

  useEffect(() => {
    if (!isZiweiTabMounted || !partnerZiweiInput) {
      setPartnerZiweiRuntime(null);
      return;
    }

    let cancelled = false;

    void runZiweiMainThread(
      partnerZiweiInput,
      (runtime) => {
        if (!cancelled) {
          setPartnerZiweiRuntime(runtime);
          setPartnerZiweiPayloadByScope(runtime.payloadByScope);
          setZiweiError('');
        }
      },
      (message) => {
        if (!cancelled) {
          setPartnerZiweiRuntime(null);
          setZiweiError(message);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [isZiweiTabMounted, partnerZiweiInput]);

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

import { lazy, Suspense, useEffect, useState, useTransition } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SegmentedControl } from '@/components/SegmentedControl';
import { PrivacyHint } from '@/components/PrivacyHint';
import { getPersonReferenceLabel, type PersonRole } from '@/lib/input-labels';
import { upsertCompatibilityHistory, upsertPersonalHistory } from '@/lib/history-records';
import {
  buildInputStateSearch,
  buildResultSearch,
  defaultInputState,
  defaultPromptState,
  type QueryInputState,
} from '@/lib/query-state';
import { clampNumericField, validateBirthInput } from '@/lib/input-validation';
import { useBirthPlace } from '@/hooks/useBirthPlace';
import { BirthPlaceModal } from './InputPage.BirthPlaceModal';
import { PersonForm } from './InputPage.PersonForm';
import { getFieldKey, getPersonValue, type SELF_FIELD_MAP } from './InputPage.field-helpers';

type InputEntryMode = 'single' | 'compatibility' | 'divination';

const LazyDivinationPanel = lazy(async () => {
  const module = await import('@/components/DivinationPanel');
  return { default: module.DivinationPanel };
});

export function InputPage() {
  const navigate = useNavigate();
  const [, startSubmitTransition] = useTransition();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form, setForm] = useState<QueryInputState>(defaultInputState);
  const [entryMode, setEntryMode] = useState<InputEntryMode>('single');
  const [error, setError] = useState('');

  const birthPlace = useBirthPlace({ form, setForm });

  useEffect(() => {
    const nextEntryMode =
      searchParams.get('mode') === 'compatibility'
        ? 'compatibility'
        : searchParams.get('mode') === 'divination'
          ? 'divination'
          : 'single';
    setEntryMode(nextEntryMode);

    if (nextEntryMode === 'divination') {
      return;
    }

    setForm((current) =>
      current.analysisMode === nextEntryMode
        ? current
        : {
            ...current,
            analysisMode: nextEntryMode,
          },
    );
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      upsertPersonalHistory(form);
    }, 500);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.name,
    form.gender,
    form.dateType,
    form.year,
    form.month,
    form.day,
    form.timeIndex,
    form.isLeapMonth,
    form.useTrueSolarTime,
    form.birthHour,
    form.birthMinute,
    form.birthPlace,
    form.birthLongitude,
  ]);

  useEffect(() => {
    if (form.analysisMode !== 'compatibility') {
      return;
    }

    const timer = window.setTimeout(() => {
      upsertCompatibilityHistory(form);
    }, 500);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    form.analysisMode,
    form.partnerName,
    form.partnerGender,
    form.partnerDateType,
    form.partnerYear,
    form.partnerMonth,
    form.partnerDay,
    form.partnerTimeIndex,
    form.partnerIsLeapMonth,
    form.partnerUseTrueSolarTime,
    form.partnerBirthHour,
    form.partnerBirthMinute,
    form.partnerBirthPlace,
    form.partnerBirthLongitude,
  ]);

  function updateField<K extends keyof QueryInputState>(key: K, value: QueryInputState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updatePersonField(
    role: PersonRole,
    key: keyof typeof SELF_FIELD_MAP,
    value: QueryInputState[keyof QueryInputState],
  ) {
    const fieldKey = getFieldKey(role, key) as keyof QueryInputState;
    updateField(fieldKey, value as QueryInputState[keyof QueryInputState]);
  }

  function updateNumericField(
    role: PersonRole,
    key: 'year' | 'month' | 'day' | 'birthHour' | 'birthMinute',
    value: string,
  ) {
    if (value === '' || /^\d*$/.test(value)) {
      updatePersonField(role, key, clampNumericField(key, value));
    }
  }

  function handleSubmit() {
    setError('');
    const selfLabel = getPersonReferenceLabel(form.analysisMode, 'self');

    if (!form.year || !form.month || !form.day) {
      setError(`请填写完整的${selfLabel}信息`);
      return;
    }

    if (!form.useTrueSolarTime && form.timeIndex === '') {
      setError(`请选择${selfLabel}的出生时辰`);
      return;
    }

    if (form.useTrueSolarTime && (form.birthHour === '' || form.birthMinute === '')) {
      setError(`请填写${selfLabel}的精准出生时间`);
      return;
    }

    if (form.useTrueSolarTime && (!form.birthPlace.trim() || !form.birthLongitude.trim())) {
      setError(`请先为${selfLabel}选择出生地`);
      return;
    }

    const selfCheck = validateBirthInput(
      {
        year: form.year,
        month: form.month,
        day: form.day,
        dateType: form.dateType,
        useTrueSolarTime: form.useTrueSolarTime,
        birthHour: form.birthHour,
        birthMinute: form.birthMinute,
        birthLongitude: form.birthLongitude,
      },
      selfLabel,
    );
    if (!selfCheck.ok) {
      setError(selfCheck.message);
      return;
    }

    if (form.analysisMode === 'compatibility') {
      if (!form.partnerYear || !form.partnerMonth || !form.partnerDay) {
        setError('请填写完整的第二人信息');
        return;
      }

      if (!form.partnerUseTrueSolarTime && form.partnerTimeIndex === '') {
        setError('请选择第二人的出生时辰');
        return;
      }

      if (
        form.partnerUseTrueSolarTime &&
        (form.partnerBirthHour === '' || form.partnerBirthMinute === '')
      ) {
        setError('请填写第二人的精准出生时间');
        return;
      }

      if (
        form.partnerUseTrueSolarTime &&
        (!form.partnerBirthPlace.trim() || !form.partnerBirthLongitude.trim())
      ) {
        setError('请先为第二人选择出生地');
        return;
      }

      const partnerCheck = validateBirthInput(
        {
          year: form.partnerYear,
          month: form.partnerMonth,
          day: form.partnerDay,
          dateType: form.partnerDateType,
          useTrueSolarTime: form.partnerUseTrueSolarTime,
          birthHour: form.partnerBirthHour,
          birthMinute: form.partnerBirthMinute,
          birthLongitude: form.partnerBirthLongitude,
        },
        '第二人',
      );
      if (!partnerCheck.ok) {
        setError(partnerCheck.message);
        return;
      }
    }

    startSubmitTransition(() => {
      navigate({
        pathname: '/result',
        search: `?${buildResultSearch(form, {
          ...defaultPromptState,
          tab: 'bazi',
          promptSource: 'bazi',
          baziShortcutMode:
            form.analysisMode === 'compatibility' ? '合婚' : defaultPromptState.baziShortcutMode,
          baziPresetId:
            form.analysisMode === 'compatibility'
              ? 'ai-compat-marriage'
              : defaultPromptState.baziPresetId,
        })}`,
      });
    });
  }

  function updateBirthTime(role: PersonRole, value: string) {
    if (!value) {
      updatePersonField(role, 'birthHour', '');
      updatePersonField(role, 'birthMinute', '');
      return;
    }

    const [hour, minute] = value.split(':');
    updatePersonField(role, 'birthHour', hour);
    updatePersonField(role, 'birthMinute', minute);
  }

  function openBirthTimeReversePage(role: PersonRole) {
    const selfLabel = getPersonReferenceLabel(form.analysisMode, role);

    if (
      !String(getPersonValue(form, role, 'year')).trim() ||
      !String(getPersonValue(form, role, 'month')).trim() ||
      !String(getPersonValue(form, role, 'day')).trim()
    ) {
      setError(`请先填写完整的${selfLabel}出生日期`);
      return;
    }

    navigate({
      pathname: '/birth-time-reverse',
      search: `?${buildInputStateSearch(form)}&target=${role}`,
    });
  }

  function updateEntryMode(value: InputEntryMode) {
    setEntryMode(value);

    if (value !== 'divination') {
      updateField('analysisMode', value);
    }

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set('mode', value);
    setSearchParams(nextSearchParams, { replace: true });
  }

  const divinationPanelFallback = (
    <div className="divination-panel-shell input-mode-loading" aria-hidden="true">
      <section className="person-section divination-form-card input-mode-loading-card">
        <div className="person-section-head input-mode-loading-head">
          <span className="skeleton-block input-mode-loading-title" />
          <span className="skeleton-block input-mode-loading-line" />
        </div>
        <div className="input-mode-loading-methods">
          {Array.from({ length: 7 }, (_, index) => (
            <span className="skeleton-block input-mode-loading-method" key={`method-${index}`} />
          ))}
        </div>
        <span className="skeleton-block input-mode-loading-textarea" />
        <div className="input-mode-loading-controls">
          <span className="skeleton-block input-mode-loading-control" />
          <span className="skeleton-block input-mode-loading-control" />
          <span className="skeleton-block input-mode-loading-chip" />
        </div>
        <div className="input-mode-loading-meta">
          <span className="skeleton-block input-mode-loading-field" />
          <span className="skeleton-block input-mode-loading-field" />
        </div>
      </section>
      <div className="form-actions page-submit-actions" aria-hidden="true">
        <span className="skeleton-block input-mode-loading-action" />
        <span className="skeleton-block input-mode-loading-action" />
      </div>
    </div>
  );

  return (
    <div className="page-shell input-page-shell">
      <div className="bazi-view-container">
        <PrivacyHint />
        <div className="analysis-mode-strip">
          <div className="top-switch-control">
            <SegmentedControl
              value={entryMode}
              options={[
                { label: '个人', value: 'single' as const },
                { label: '合盘', value: 'compatibility' as const },
                { label: '占卜', value: 'divination' as const },
              ]}
              onChange={updateEntryMode}
            />
          </div>
        </div>

        <div className="analysis-view">
          {entryMode === 'divination' ? (
            <Suspense fallback={divinationPanelFallback}>
              <LazyDivinationPanel />
            </Suspense>
          ) : (
            <div className="form-wrapper">
              <PersonForm
                role="self"
                form={form}
                updatePersonField={updatePersonField}
                updateNumericField={updateNumericField}
                updateBirthTime={updateBirthTime}
                openBirthPlaceModal={birthPlace.openBirthPlaceModal}
                openBirthTimeReversePage={openBirthTimeReversePage}
              />
              {entryMode === 'compatibility' ? (
                <PersonForm
                  role="partner"
                  form={form}
                  updatePersonField={updatePersonField}
                  updateNumericField={updateNumericField}
                  updateBirthTime={updateBirthTime}
                  openBirthPlaceModal={birthPlace.openBirthPlaceModal}
                  openBirthTimeReversePage={openBirthTimeReversePage}
                />
              ) : null}

              {error ? <div className="form-error-text global-form-error">{error}</div> : null}

              <div
                className="form-actions page-submit-actions"
                style={{
                  width: '100%',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  justifyItems: 'stretch',
                }}
              >
                <button
                  className="secondary-page-button"
                  type="button"
                  style={{ width: '100%' }}
                  onClick={() =>
                    navigate(
                      `/records?tab=${entryMode === 'compatibility' ? 'compatibility' : 'personal'}`,
                    )
                  }
                >
                  历史记录
                </button>
                <button
                  className="primary-button start-submit-button"
                  type="button"
                  onClick={handleSubmit}
                  style={{ width: '100%' }}
                >
                  开始排盘
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="input-page-bottom-tools">
          <div className="tutorial-entry-card">
            <div className="tutorial-entry-copy">
              <strong>第一次使用？先看教程</strong>
              <p>里面会说明三种模式分别怎么用，以及从录入到查看结果的完整步骤。</p>
            </div>
            <button
              type="button"
              className="tutorial-entry-button"
              onClick={() => navigate('/tutorial')}
            >
              查看教程
            </button>
          </div>
        </div>
      </div>

      {birthPlace.isBirthPlaceModalOpen ? <BirthPlaceModal birthPlace={birthPlace} /> : null}
    </div>
  );
}

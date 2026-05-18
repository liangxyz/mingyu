import type { AnalysisPayloadV1 } from '../../types/analysis';
import { buildZiweiReadableSnapshot } from './snapshot';
import type { PromptContext } from './types';

export type { PromptContext } from './types';

export function buildPortablePromptPack(params: {
  payload: AnalysisPayloadV1;
  reportContext: PromptContext;
}) {
  const { payload, reportContext } = params;

  return [buildZiweiReadableSnapshot({ payload, reportContext })].join('\n');
}

import {
  DIVINATION_METHOD_OPTIONS,
  LIUREN_TEMPLATE_OPTIONS,
  MEIHUA_METHOD_OPTIONS,
  TAROT_SPREAD_OPTIONS,
} from '@/lib/divination/config';
import type { DivinationDraft } from '@/lib/divination/engine';

export const defaultDraft: DivinationDraft = {
  method: 'random',
  question: '',
  gender: '',
  birthYear: '',
  meihuaMethod: 'time',
  meihuaNumber: '',
  liurenTemplate: 'general',
  tarotSpread: 'three',
};

export const methodLabelMap = Object.fromEntries(
  DIVINATION_METHOD_OPTIONS.map((item) => [item.value, item.label]),
) as Record<DivinationDraft['method'], string>;

export const meihuaMethodLabelMap = Object.fromEntries(
  MEIHUA_METHOD_OPTIONS.map((item) => [item.value, item.label]),
) as Record<NonNullable<DivinationDraft['meihuaMethod']>, string>;

export const tarotSpreadLabelMap = Object.fromEntries(
  TAROT_SPREAD_OPTIONS.map((item) => [item.value, item.label]),
) as Record<NonNullable<DivinationDraft['tarotSpread']>, string>;

export const liurenTemplateLabelMap = Object.fromEntries(
  LIUREN_TEMPLATE_OPTIONS.map((item) => [item.value, item.label]),
) as Record<NonNullable<DivinationDraft['liurenTemplate']>, string>;

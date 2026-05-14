import type { ClimateRule } from '../types';

export const WU_WU_CLIMATE_RULES: ClimateRule[] = [
  {
    id: 'wu-month-wu-gui-bing-first',
    label: '戊日午月先癸后丙规则',
    description: '戊土生午月，夏燥正盛，传统多以癸水润燥为先、丙火暖局为佐。',
    priority: 120,
    months: ['午'],
    dayMasters: ['土'],
    dayStems: ['戊'],
    usefulWuxing: '水',
    favorableOrder: ['水', '火'],
    hint: '戊土午月，先癸后丙',
  },
  {
    id: 'wu-month-wu-gui-bing-xin-all',
    label: '戊日午月癸丙辛全透极品规则',
    description: '戊土生午月，癸丙辛三者全透，较合原文"戊土生午月，三者全透，鼎甲可期"。',
    priority: 126,
    months: ['午'],
    dayMasters: ['土'],
    dayStems: ['戊'],
    requiredVisibleStems: ['癸', '丙', '辛'],
    usefulWuxing: '水',
    favorableOrder: ['水', '火', '金'],
    traceHints: ['取用层次:癸丙辛三者全透', '成格层次:鼎甲可期'],
    hint: '戊土午月癸丙辛三者全透，鼎甲可期',
  },
];

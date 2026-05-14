import type { ClimateRule } from '../types';

export const WU_SI_CLIMATE_RULES: ClimateRule[] = [
  {
    id: 'si-month-wu-gui-bing-first',
    label: '戊日巳月先癸后丙规则',
    description: '戊土生巳月，夏燥土焦，传统多以癸水润燥、丙火暖局，先后有序。',
    priority: 120,
    months: ['巳'],
    dayMasters: ['土'],
    dayStems: ['戊'],
    usefulWuxing: '水',
    favorableOrder: ['水', '火'],
    hint: '戊土巳月，先癸后丙',
  },
  {
    id: 'si-month-wu-gui-bing-xin-all',
    label: '戊日巳月癸丙辛全透极品规则',
    description: '戊土生巳月，癸丙辛三者全透，较合原文"戊土生巳月，三者全透，鼎甲可期"。',
    priority: 126,
    months: ['巳'],
    dayMasters: ['土'],
    dayStems: ['戊'],
    requiredVisibleStems: ['癸', '丙', '辛'],
    usefulWuxing: '水',
    favorableOrder: ['水', '火', '金'],
    traceHints: ['取用层次:癸丙辛三者全透', '成格层次:鼎甲可期'],
    hint: '戊土巳月癸丙辛三者全透，鼎甲可期',
  },
];

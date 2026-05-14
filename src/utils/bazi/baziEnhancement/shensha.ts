/**
 * 神煞系统扩充：桃花详解与限运分析。
 */

import type { PatternAnalysis } from '../baziTypes';

interface PeachBlossomDetail {
  type: '墙内桃花' | '墙外桃花' | '普通桃花';
  position: string;
  description: string;
  favorable: string;
  unfavorable: string;
}

const PEACH_BLOSSOM_DETAILS: Record<string, PeachBlossomDetail> = {
  墙内桃花: {
    type: '墙内桃花',
    position: '日支（夫妻宫）、年柱',
    description:
      '墙内桃花指在日支（夫妻宫）或年柱的桃花。日支为夫妻宫，桃花在夫妻宫内，主正当的夫妻感情，主配偶有魅力、感情丰富。年柱桃花多主祖上或早年异性缘。',
    favorable: '婚姻内感情和谐，配偶有魅力，利于夫妻关系',
    unfavorable: '需防配偶异性缘过旺',
  },
  墙外桃花: {
    type: '墙外桃花',
    position: '时柱、月柱',
    description:
      '墙外桃花指在时柱或月柱的桃花。时柱为子女宫、晚运，月柱为事业宫、社会宫，桃花在此主外部社交中的异性缘，容易招惹婚外桃花，需谨慎对待。',
    favorable: '异性缘佳，社交魅力出众，利于演艺、文艺等职业',
    unfavorable: '感情易有纠纷，需防婚外情，需谨慎对待感情',
  },
  普通桃花: {
    type: '普通桃花',
    position: '其他位置',
    description: '普通桃花指神煞桃花在一般位置，影响力适中。',
    favorable: '有一定的异性缘',
    unfavorable: '需适度把握',
  },
};

export function getPeachBlossomDetail(
  pillarPosition: 'year' | 'month' | 'day' | 'hour',
): PeachBlossomDetail {
  if (pillarPosition === 'day' || pillarPosition === 'year') {
    return PEACH_BLOSSOM_DETAILS['墙内桃花'];
  } else if (pillarPosition === 'month' || pillarPosition === 'hour') {
    return PEACH_BLOSSOM_DETAILS['墙外桃花'];
  }
  return PEACH_BLOSSOM_DETAILS['普通桃花'];
}

export interface PeriodAnalysis {
  earlyStage: {
    description: string;
    focus: string[];
    tips: string[];
  };
  midStage: {
    description: string;
    focus: string[];
    tips: string[];
  };
  lateStage: {
    description: string;
    focus: string[];
    tips: string[];
  };
}

export function generatePeriodAnalysis(
  pattern: PatternAnalysis,
  strengthStatus: string,
  _dayStem: string,
): PeriodAnalysis {
  const baseTips = pattern.isSpecial
    ? ['顺势而行', '化敌为友']
    : strengthStatus.includes('强')
      ? ['抑制过旺', '泄秀为用']
      : ['扶助过弱', '生身为用'];

  return {
    earlyStage: {
      description: '少年时期，多受父母、长辈影响，性格形成阶段。',
      focus: ['学业发展', '性格培养', '身体健康'],
      tips: ['打好学习基础', '培养良好习惯', '注意安全'],
    },
    midStage: {
      description: '青中年时期，是人生事业、感情发展的关键阶段。',
      focus: ['事业发展', '感情婚姻', '财富积累'],
      tips: [...baseTips, '把握机遇', '稳健发展'],
    },
    lateStage: {
      description: '中老年时期，注重健康养生、子女发展。',
      focus: ['身体健康', '子女缘分', '晚年规划'],
      tips: ['注重养生', '家庭和睦', '传承家风'],
    },
  };
}

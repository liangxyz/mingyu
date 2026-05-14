import type { LiurenData, LiurenTransmission } from '../../../../../types/divination';

const LIUCHONG_MAP: Record<string, string> = {
  子: '午',
  丑: '未',
  寅: '申',
  卯: '酉',
  辰: '戌',
  巳: '亥',
  午: '子',
  未: '丑',
  申: '寅',
  酉: '卯',
  戌: '辰',
  亥: '巳',
};

export function buildTransmissionNote(stage: LiurenTransmission['stage'], relation: string) {
  const stagePrefixMap: Record<LiurenTransmission['stage'], string> = {
    初传: '事情起点',
    中传: '过程阶段',
    末传: '结果落点',
  };

  if (relation === '比和') {
    return `${stagePrefixMap[stage]}偏平稳，可按既定节奏推进。`;
  }
  if (relation.includes('生')) {
    return `${stagePrefixMap[stage]}有承接与转机，适合顺势发力。`;
  }
  if (relation.includes('克')) {
    return `${stagePrefixMap[stage]}阻力更明显，宜先拆解卡点。`;
  }

  return `${stagePrefixMap[stage]}变化较杂，需要边走边校正。`;
}

export function getTransmissionPattern(
  chu: string,
  zhong: string,
  mo: string,
): LiurenData['transmissionPattern'] {
  if (chu === zhong && zhong === mo) {
    return '伏吟';
  }
  if (LIUCHONG_MAP[chu] === mo) {
    return '反吟';
  }
  if (chu === mo) {
    return '回环';
  }

  return '递传';
}

export function getPatternTag(pattern: LiurenData['transmissionPattern']) {
  if (pattern === '伏吟') {
    return '伏吟';
  }
  if (pattern === '反吟') {
    return '反吟';
  }
  if (pattern === '回环') {
    return '回环';
  }

  return '递传';
}

export function buildTransmissionDetail(
  rule: string,
  pattern: LiurenData['transmissionPattern'],
  transmissions: LiurenTransmission[],
) {
  const stageText = transmissions.map((item) => `${item.stage}${item.branch}`).join(' → ');
  return `取传采用${rule}，传态为${pattern}，链路为${stageText}。`;
}

export function buildDivinationTemplateHint(
  transmissions: LiurenTransmission[],
  pattern: LiurenData['transmissionPattern'],
) {
  const [chu, zhong, mo] = transmissions;
  if (!chu || !zhong || !mo) {
    throw new Error('buildDivinationTemplateHint 需要完整的三传(初/中/末)。');
  }
  return `断课模板：先看${chu.stage}(${chu.branch})定起因，再看${zhong.stage}(${zhong.branch})看过程，最后看${mo.stage}(${mo.branch})定结果；传态为${pattern}。`;
}

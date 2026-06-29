export const BRANCH_WUXING: Record<string, string> = {
  子: '水',
  丑: '土',
  寅: '木',
  卯: '木',
  辰: '土',
  巳: '火',
  午: '火',
  未: '土',
  申: '金',
  酉: '金',
  戌: '土',
  亥: '水',
};

// 月令当令五行（按月建地支本气定当令之神）：
// 同令为旺，令生为相，生令为休，令克为囚，克令为死。
// 六爻、梅花共用，比季节粗分（春夏秋冬）更精确。
export const MONTH_LING_WUXING: Record<string, string> = {
  子: '水',
  丑: '土',
  寅: '木',
  卯: '木',
  辰: '土',
  巳: '火',
  午: '火',
  未: '土',
  申: '金',
  酉: '金',
  戌: '土',
  亥: '水',
};

/**
 * 按《增删卜易》月令提纲定五行旺相休囚死：
 * 旺=同令，相=令生，休=生令，囚=令克，死=克令。
 */
export function getSeasonState(
  yaoWuxing: string,
  monthBranch: string,
): '旺' | '相' | '休' | '囚' | '死' | '平' {
  const lingWuxing = MONTH_LING_WUXING[monthBranch];
  if (!lingWuxing || !yaoWuxing) {
    return '平';
  }
  if (lingWuxing === yaoWuxing) return '旺';
  if (isSheng(lingWuxing, yaoWuxing)) return '相';
  if (isSheng(yaoWuxing, lingWuxing)) return '休';
  if (isKe(lingWuxing, yaoWuxing)) return '囚';
  if (isKe(yaoWuxing, lingWuxing)) return '死';
  return '平';
}

const SHENG_MAP: Record<string, string> = {
  木: '火',
  火: '土',
  土: '金',
  金: '水',
  水: '木',
};

const KE_MAP: Record<string, string> = {
  木: '土',
  土: '水',
  水: '火',
  火: '金',
  金: '木',
};

export function getBranchWuxing(branch: string): string {
  return BRANCH_WUXING[branch] || '';
}

export function isSheng(source: string, target: string): boolean {
  return SHENG_MAP[source] === target;
}

export function isKe(source: string, target: string): boolean {
  return KE_MAP[source] === target;
}

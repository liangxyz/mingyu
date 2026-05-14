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

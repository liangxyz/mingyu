import type { ScopeType } from '@/types/analysis';

export function formatPalaceName(name: string) {
  return name.endsWith('宫') ? name : `${name}宫`;
}

export function normalizePalaceName(name: string) {
  return name.endsWith('宫') ? name.slice(0, -1) : name;
}

export function mapTopicLabel(selectedTopic: string) {
  switch (selectedTopic) {
    case 'destiny':
      return '命局解读';
    case 'relationship':
      return '婚姻感情';
    case 'career-wealth':
      return '事业财运';
    case 'life':
      return '人生解析';
    case 'chat':
      return '自由聊天';
    default:
      return '提示词解读';
  }
}

export function mapReportTypeLabel(reportType: string) {
  switch (reportType) {
    case 'destiny-overview':
      return '命局综述';
    case 'palace':
      return '宫位详解';
    case 'scope':
      return '阶段报告';
    case 'relationship':
      return '婚姻感情专题';
    case 'career-wealth':
      return '事业财运专题';
    case 'life':
      return '人生解析专题';
    case 'chat':
      return '自由问答';
    default:
      return 'AI 解读报告';
  }
}

export function mapScopeLabel(scope: ScopeType) {
  switch (scope) {
    case 'origin':
      return '本命';
    case 'decadal':
      return '大限';
    case 'yearly':
      return '流年';
    case 'monthly':
      return '流月';
    case 'daily':
      return '流日';
    case 'hourly':
      return '流时';
    case 'age':
      return '小限';
  }
}

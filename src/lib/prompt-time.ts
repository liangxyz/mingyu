export function formatPromptCurrentTime(date: Date = new Date()) {
  return `公历：${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}时${date.getMinutes()}分`;
}

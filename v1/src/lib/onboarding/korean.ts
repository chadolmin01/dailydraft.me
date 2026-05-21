/** 마지막 글자에 받침(종성)이 있는지 확인 */
function hasBatchim(word: string): boolean {
  if (!word) return false
  const code = word.charCodeAt(word.length - 1)
  if (code < 0xAC00 || code > 0xD7A3) return false
  return (code - 0xAC00) % 28 !== 0
}

/** 을/를, 이/가, 은/는, 이/가 등 조사 선택 */
export function josa(word: string, withBatchim: string, noBatchim: string): string {
  if (!word) return noBatchim
  return hasBatchim(word) ? withBatchim : noBatchim
}

/** 로/으로 (받침 있으면 으로, 없으면 로. 단, ㄹ 받침은 로) */
export function euro(word: string): string {
  if (!word) return '로'
  const code = word.charCodeAt(word.length - 1)
  if (code < 0xAC00 || code > 0xD7A3) return '로'
  const batchim = (code - 0xAC00) % 28
  if (batchim === 0) return '로'       // 받침 없음
  if (batchim === 8) return '로'       // ㄹ 받침
  return '으로'
}

/** 로서/으로서 */
export function euroSeo(word: string): string {
  return euro(word) + '서'
}

/** 이에요/예요 */
export function ieyo(word: string): string {
  return hasBatchim(word) ? '이에요' : '예요'
}

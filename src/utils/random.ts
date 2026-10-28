// ============================================================
// 随机工具：整数、数组抽取、加权抽取、概率命中、日期格式化
// ============================================================

/** 生成 [min, max] 闭区间内的随机整数 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** 从数组中随机取一个元素 */
export function pick<T>(list: readonly T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

/** 按权重随机抽取，权重越大越容易命中 */
export function pickWeighted<T extends { weight: number }>(list: readonly T[]): T {
  const total = list.reduce((sum, item) => sum + item.weight, 0)
  let roll = Math.random() * total
  for (const item of list) {
    roll -= item.weight
    if (roll <= 0) return item
  }
  return list[list.length - 1]
}

/** 数字补零，如 3 -> '03' */
export function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

/** 概率命中，probability 取值 0 ~ 1 */
export function chance(probability: number): boolean {
  return Math.random() < probability
}

/** 格式化为证件上的日期写法：2019.01.17 */
export function formatCardDate(date: Date): string {
  return `${date.getFullYear()}.${pad2(date.getMonth() + 1)}.${pad2(date.getDate())}`
}

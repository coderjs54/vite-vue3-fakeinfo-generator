// ============================================================
// 身份证号工具：生成、校验码计算、解析出生日期与性别
// 号码规则：6 位地址码 + 8 位出生日期码 + 3 位顺序码 + 1 位校验码
// ============================================================

import type { Gender } from '@/types'
import { pad2, randomInt } from './random'

/** 前 17 位加权因子 */
const WEIGHTS = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
/** 余数映射的校验码 */
const CHECK_CODES = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']

/** 计算 18 位身份证号的校验位 */
export function computeCheckCode(first17: string): string {
  let sum = 0
  for (let i = 0; i < 17; i++) {
    sum += Number(first17[i]) * WEIGHTS[i]
  }
  return CHECK_CODES[sum % 11]
}

/** 生成 18 位身份证号：地址码 + 出生日期 + 顺序码（奇男偶女）+ 校验码 */
export function buildIdNumber(regionCode: string, birth: Date, gender: Gender): string {
  const birthPart = `${birth.getFullYear()}${pad2(birth.getMonth() + 1)}${pad2(birth.getDate())}`
  // 顺序码末位决定性别：奇数为男，偶数为女
  let sequence = randomInt(1, 999)
  const needOdd = gender === '男'
  if (needOdd !== (sequence % 2 === 1)) {
    sequence = sequence === 999 ? 998 : sequence + 1
  }
  const first17 = `${regionCode}${birthPart}${String(sequence).padStart(3, '0')}`
  return `${first17}${computeCheckCode(first17)}`
}

export interface ParsedIdNumber {
  regionCode: string
  birth: Date
  gender: Gender
}

/** 解析并校验身份证号，非法时返回 null */
export function parseIdNumber(input: string): ParsedIdNumber | null {
  const value = input.trim().toUpperCase()
  if (!/^\d{17}[\dX]$/.test(value)) return null
  if (computeCheckCode(value.slice(0, 17)) !== value[17]) return null

  const year = Number(value.slice(6, 10))
  const month = Number(value.slice(10, 12))
  const day = Number(value.slice(12, 14))
  const birth = new Date(year, month - 1, day)
  // 排除 2 月 30 日这类非法日期
  if (
    birth.getFullYear() !== year ||
    birth.getMonth() !== month - 1 ||
    birth.getDate() !== day
  ) {
    return null
  }

  return {
    regionCode: value.slice(0, 6),
    birth,
    gender: Number(value[16]) % 2 === 1 ? '男' : '女',
  }
}

/** 快速判断身份证号是否合法 */
export function isValidIdNumber(input: string): boolean {
  return parseIdNumber(input) !== null
}

/**
 * 宽松提取出生日期与性别（不校验校验位）
 * 用于「边输入边预览」：号码还差一位时也能给出合理的预览数据，
 * 正式导出前仍用 parseIdNumber 做严格校验。
 */
export function extractIdBasics(
  input: string,
): { regionCode: string; birth: Date; gender: Gender } | null {
  const value = input.trim().toUpperCase()
  if (!/^\d{17}[\dX]$/.test(value)) return null

  const year = Number(value.slice(6, 10))
  const month = Number(value.slice(10, 12))
  const day = Number(value.slice(12, 14))
  const birth = new Date(year, month - 1, day)
  if (Number.isNaN(birth.getTime())) return null
  if (year < 1900 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) return null

  return {
    regionCode: value.slice(0, 6),
    birth,
    gender: Number(value[16]) % 2 === 1 ? '男' : '女',
  }
}

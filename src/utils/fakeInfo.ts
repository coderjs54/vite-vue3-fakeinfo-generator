// ============================================================
// 随机身份信息生成：姓名、民族、地址、签发机关、有效期限、身份证号
// 生成规则对齐原站（idimg.pages.dev）的 JS 逻辑：
//   · 姓名 = 姓 + 1~2 个名字用字，长度分布 39% / 60% / 1%
//   · 民族按人口权重抽取，汉族占比 91%+
//   · 住址 = 省市区 + 乡镇街道 + 门牌（约 10% 不带门牌号）
//   · 有效期限按「签发年份 - 出生年份」推导 5 / 10 / 20 年或长期
//   · 签发机关按 40% 概率使用区县分局（且总长度不超过 11 字）
// ============================================================

import {
  COMMUNITY_NAMES,
  ROAD_NAMES,
  ROAD_SUFFIXES,
  TOWN_NAMES,
  TOWN_SUFFIXES,
  VILLAGE_SUFFIXES,
} from '@/data/addresses'
import {
  FEMALE_NAME_ENDS,
  FEMALE_NAME_STARTS,
  MALE_NAME_ENDS,
  MALE_NAME_STARTS,
  SURNAMES,
} from '@/data/names'
import { NATIONS } from '@/data/nations'
import {
  REGIONS,
  regionAuthorityBase,
  regionAuthorityBranch,
  regionFullName,
  type Region,
} from '@/data/regions'
import type { Gender, IdCardInfo } from '@/types'
import { buildIdNumber } from './idNumber'
import { chance, formatCardDate, pad2, pick, pickWeighted, randomInt } from './random'

/** 名字长度的概率分布：两字名 39%、三字名 60%、四字名 1% */
const GIVEN_NAME_LENGTH_RATES = [0.39, 0.99] as const
/** 不带门牌号的住址占比（对应原站约 10%） */
const NO_HOUSE_NUMBER_RATE = 0.1
/** 使用区县分局作为签发机关的概率 */
const BRANCH_AUTHORITY_RATE = 0.4
/** 分局名称的最大字数，超出则退回市级公安局 */
const BRANCH_AUTHORITY_MAX_LENGTH = 11

/** 随机姓名：姓 + 1~2 个名字用字（按性别挑选用字池） */
export function createRandomName(gender: Gender): string {
  const surname = pick(SURNAMES)
  const starts = gender === '男' ? MALE_NAME_STARTS : FEMALE_NAME_STARTS
  const ends = gender === '男' ? MALE_NAME_ENDS : FEMALE_NAME_ENDS

  const roll = Math.random()
  if (roll < GIVEN_NAME_LENGTH_RATES[0]) {
    return `${surname}${pick(starts)}`
  }
  if (roll < GIVEN_NAME_LENGTH_RATES[1]) {
    return `${surname}${pick(starts)}${pick(ends)}`
  }
  // 四字名：姓 + 首字 + 两个次字
  return `${surname}${pick(starts)}${pick(ends)}${pick(ends)}`
}

/** 随机民族（汉族占比最高） */
export function createRandomNation(): string {
  return pickWeighted(NATIONS).name
}

/**
 * 在行政区划基础上拼接随机门牌地址
 * 约 10% 的地址只精确到乡镇街道，不带门牌号（与原站一致）
 */
export function createRandomAddress(region: Region): string {
  const prefix = regionFullName(region)
  const town = `${pick(TOWN_NAMES)}${pick(TOWN_SUFFIXES)}`
  const hasHouseNumber = !chance(NO_HOUSE_NUMBER_RATE)

  const roll = Math.random()
  if (roll < 0.5) {
    const road = `${pick(ROAD_NAMES)}${pick(ROAD_SUFFIXES)}`
    return `${prefix}${town}${road}${hasHouseNumber ? `${randomInt(1, 900)}号` : ''}`
  }
  if (roll < 0.8) {
    const village = `${pick(TOWN_NAMES)}${pick(VILLAGE_SUFFIXES)}`
    return `${prefix}${town}${village}${hasHouseNumber ? `${randomInt(1, 120)}号` : ''}`
  }
  if (!hasHouseNumber) {
    return `${prefix}${town}`
  }
  const building = randomInt(1, 28)
  const unit = randomInt(1, 6)
  const floor = randomInt(1, 3)
  const room = randomInt(1, 4)
  return `${prefix}${town}${pick(COMMUNITY_NAMES)}小区${building}栋${unit}单元${floor}0${room}室`
}

/** 随机出生日期（按年龄段限制，保证是成年人） */
export function createRandomBirthDate(minAge = 18, maxAge = 62): Date {
  const now = new Date()
  const age = randomInt(minAge, maxAge)
  const year = now.getFullYear() - age
  const month = randomInt(1, 12)
  // 按月份实际天数取日，避免出现 2 月 30 日
  const maxDay = new Date(year, month, 0).getDate()
  return new Date(year, month - 1, randomInt(1, maxDay))
}

/**
 * 推导有效期限（与真实签发规则一致）
 * 签发时未满 16 周岁为 5 年，16~25 周岁为 10 年，26~45 周岁为 20 年，46 周岁以上为长期
 */
export function createValidity(birth: Date): { validStart: string; validEnd: string } {
  const now = new Date()
  const nowYear = now.getFullYear()

  // 有效年限：按签发时的年龄推导（未满 16 岁 5 年、16~25 岁 10 年、26~45 岁 20 年、46 岁以上长期）
  const validityYears = (issueYear: number): number => {
    const span = issueYear - birth.getFullYear()
    if (span < 16) return 5
    if (span <= 25) return 10
    if (span <= 45) return 20
    return 0
  }

  // 签发年份不早于年满 16 周岁那年，也不晚于今年
  const earliestYear = Math.min(birth.getFullYear() + 16, nowYear)
  let issueYear = randomInt(earliestYear, nowYear)
  let years = validityYears(issueYear)

  // 避免随机出早已过期的证件：把签发年份顺延到当前有效期内（相当于补办了新证）
  if (years && issueYear + years < nowYear) {
    issueYear = nowYear - randomInt(0, years - 1)
    years = validityYears(issueYear)
  }

  const issue = new Date(issueYear, randomInt(0, 11), randomInt(1, 28))
  if (issue > now) issue.setTime(now.getTime())

  const validStart = formatCardDate(issue)
  if (!years) return { validStart, validEnd: '长期' }

  const endYear = issue.getFullYear() + years
  const endDay = Math.min(issue.getDate(), new Date(endYear, issue.getMonth() + 1, 0).getDate())
  const validEnd = `${endYear}.${pad2(issue.getMonth() + 1)}.${pad2(endDay)}`
  return { validStart, validEnd }
}

/**
 * 随机签发机关
 * 约 40% 概率落到区县分局，但名称超过 11 字时回退到市级公安局（与原站一致）
 */
export function createRandomAuthority(region: Region): string {
  const base = regionAuthorityBase(region)
  const branch = regionAuthorityBranch(region)
  if (chance(BRANCH_AUTHORITY_RATE) && Array.from(branch).length <= BRANCH_AUTHORITY_MAX_LENGTH) {
    return branch
  }
  return base
}

/** 中国大陆手机号段（130~199 各运营商的在用号段） */
const PHONE_PREFIXES = [
  '130', '131', '132', '133', '134', '135', '136', '137', '138', '139',
  '145', '146', '147', '148', '149',
  '150', '151', '152', '153', '155', '156', '157', '158', '159',
  '166', '170', '171', '172', '173', '175', '176', '177', '178',
  '180', '181', '182', '183', '184', '185', '186', '187', '188', '189',
  '191', '193', '195', '196', '197', '198', '199',
] as const

/** 生成 11 位中国大陆手机号（1 开头 + 合法号段 + 8 位随机数） */
export function createRandomPhone(): string {
  return `${pick(PHONE_PREFIXES)}${String(randomInt(0, 99999999)).padStart(8, '0')}`
}

/** 随机资料：卡面信息 + 手机号（手机号只做资料展示，不印在卡面上） */
export type RandomProfile = IdCardInfo & { phone: string }

/** 生成一整套随机身份信息（身份证号校验位合法） */
export function createRandomInfo(): RandomProfile {
  const region = pick(REGIONS)
  const gender: Gender = chance(0.5) ? '男' : '女'
  const birth = createRandomBirthDate()

  return {
    name: createRandomName(gender),
    gender,
    nation: createRandomNation(),
    phone: createRandomPhone(),
    birth,
    address: createRandomAddress(region),
    idNumber: buildIdNumber(region.code, birth, gender),
    authority: createRandomAuthority(region),
    ...createValidity(birth),
  }
}

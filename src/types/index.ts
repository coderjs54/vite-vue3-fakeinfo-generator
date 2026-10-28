/** 性别 */
export type Gender = '男' | '女'

/** 证件正反面 */
export type CardSide = 'front' | 'back'

/** 渲染身份证所需的完整信息 */
export interface IdCardInfo {
  /** 姓名 */
  name: string
  /** 性别（由身份证号第 17 位推导） */
  gender: Gender
  /** 民族，如：汉 */
  nation: string
  /** 出生日期 */
  birth: Date
  /** 住址 */
  address: string
  /** 18 位公民身份号码 */
  idNumber: string
  /** 签发机关 */
  authority: string
  /** 有效期限起始，如：2019.01.17 */
  validStart: string
  /** 有效期限结束，如：2029.01.17 或 长期 */
  validEnd: string
}

/** 表单字段（不含由身份证号推导的性别、出生日期） */
export interface IdFormState {
  name: string
  nation: string
  /** 手机号（仅作资料展示，不参与卡面渲染） */
  phone: string
  idNumber: string
  address: string
  authority: string
  validStart: string
  validEnd: string
}

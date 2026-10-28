// ============================================================
// 民族数据：56 个民族 + 使用权重（汉族占绝大多数）
// ============================================================

export interface NationOption {
  name: string
  /** 随机抽取权重 */
  weight: number
}

/** 56 个民族，汉族权重远高于其他民族 */
export const NATIONS: NationOption[] = [
  { name: '汉', weight: 91.5 },
  { name: '壮', weight: 1.2 },
  { name: '回', weight: 0.9 },
  { name: '满', weight: 0.8 },
  { name: '维吾尔', weight: 0.7 },
  { name: '苗', weight: 0.7 },
  { name: '彝', weight: 0.6 },
  { name: '土家', weight: 0.55 },
  { name: '藏', weight: 0.45 },
  { name: '蒙古', weight: 0.4 },
  { name: '侗', weight: 0.3 },
  { name: '布依', weight: 0.3 },
  { name: '瑶', weight: 0.25 },
  { name: '白', weight: 0.2 },
  { name: '朝鲜', weight: 0.18 },
  { name: '哈尼', weight: 0.15 },
  { name: '黎', weight: 0.15 },
  { name: '哈萨克', weight: 0.12 },
  { name: '傣', weight: 0.12 },
  { name: '畲', weight: 0.08 },
  { name: '傈僳', weight: 0.07 },
  { name: '东乡', weight: 0.06 },
  { name: '仡佬', weight: 0.05 },
  { name: '拉祜', weight: 0.05 },
  { name: '佤', weight: 0.04 },
  { name: '水', weight: 0.04 },
  { name: '纳西', weight: 0.03 },
  { name: '羌', weight: 0.03 },
  { name: '土', weight: 0.03 },
  { name: '仫佬', weight: 0.02 },
  { name: '锡伯', weight: 0.02 },
  { name: '柯尔克孜', weight: 0.02 },
  { name: '景颇', weight: 0.02 },
  { name: '达斡尔', weight: 0.02 },
  { name: '撒拉', weight: 0.02 },
  { name: '布朗', weight: 0.02 },
  { name: '毛南', weight: 0.01 },
  { name: '塔吉克', weight: 0.01 },
  { name: '普米', weight: 0.01 },
  { name: '阿昌', weight: 0.01 },
  { name: '怒', weight: 0.01 },
  { name: '鄂温克', weight: 0.01 },
  { name: '京', weight: 0.01 },
  { name: '基诺', weight: 0.01 },
  { name: '德昂', weight: 0.01 },
  { name: '保安', weight: 0.01 },
  { name: '俄罗斯', weight: 0.01 },
  { name: '裕固', weight: 0.01 },
  { name: '乌孜别克', weight: 0.01 },
  { name: '门巴', weight: 0.01 },
  { name: '鄂伦春', weight: 0.01 },
  { name: '独龙', weight: 0.01 },
  { name: '塔塔尔', weight: 0.01 },
  { name: '赫哲', weight: 0.01 },
  { name: '高山', weight: 0.01 },
  { name: '珞巴', weight: 0.01 },
]

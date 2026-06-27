/**
 * 春联平仄/对仗分析（中华新韵：一二声=平，三四声=仄）。
 *
 * 体积较大（pinyin-pro 含字典），由展示组件按需动态 import，避免进主 bundle。
 * 本文件保持「纯」：仅依赖 pinyin-pro（同构、无 Node 内置依赖）。
 */
import { pinyin } from 'pinyin-pro'

export type Tone = '平' | '仄'

export interface ToneChar {
  char: string
  /** 拼音（不含声调数字），非汉字为空 */
  py: string
  /** 平/仄；非汉字（标点等）为 null */
  tone: Tone | null
}

export interface CoupletToneAnalysis {
  上联: ToneChar[]
  下联: ToneChar[]
  /** 上联末字仄、下联末字平（对联铁律） */
  尾字合律: boolean
  /** 上下联同位平仄相对的比例（0~1，仅统计两边都是汉字的位置） */
  对仗度: number
  /** 同位平仄相同（出律）的字索引，供 UI 标注 */
  出律位置: number[]
  /** 综合是否合律 */
  合律: boolean
  /** 简短结论文案 */
  结论: string
}

/** 是否汉字（CJK 统一表意文字 U+4E00–U+9FFF） */
function isHan(char: string): boolean {
  const cp = char.codePointAt(0) ?? 0
  return cp >= 0x4E00 && cp <= 0x9FFF
}

/** 取单字的拼音与平仄；非汉字返回 tone=null */
export function toneOf(char: string): ToneChar {
  if (!isHan(char))
    return { char, py: '', tone: null }

  // 多音字取默认（最常见）读音即可；toneType:'num' → 如 'chun1'
  const raw = (pinyin(char, { toneType: 'num', type: 'string' }) as string) || ''
  const m = /([0-5])\s*$/.exec(raw)
  const n = m ? Number(m[1]) : 0
  // 一二声 = 平；三四声 = 仄；轻声(0/5)按平处理
  const tone: Tone = n === 3 || n === 4 ? '仄' : '平'
  return { char, py: raw.replace(/[0-5\s]/g, ''), tone }
}

/** 分析一组上下联的平仄与对仗 */
export function analyzeCouplet(上联: string, 下联: string): CoupletToneAnalysis {
  const top = [...(上联 || '')].map(toneOf)
  const bottom = [...(下联 || '')].map(toneOf)

  const n = Math.min(top.length, bottom.length)
  const 出律位置: number[] = []
  let comparable = 0
  let opposed = 0
  for (let i = 0; i < n; i++) {
    const t = top[i]?.tone
    const b = bottom[i]?.tone
    if (!t || !b)
      continue
    comparable++
    if (t !== b)
      opposed++
    else
      出律位置.push(i)
  }
  const 对仗度 = comparable ? opposed / comparable : 0

  const topLast = [...top].reverse().find(c => c.tone)
  const botLast = [...bottom].reverse().find(c => c.tone)
  const 尾字合律 = topLast?.tone === '仄' && botLast?.tone === '平'

  const 合律 = 尾字合律 && 对仗度 >= 0.6

  let 结论: string
  if (合律)
    结论 = 对仗度 === 1 ? '平仄工整、合律' : '基本合律'
  else if (!尾字合律)
    结论 = '尾字出律：上联宜仄收、下联宜平收'
  else
    结论 = `平仄相对偏弱（${出律位置.length} 处同声）`

  return { 上联: top, 下联: bottom, 尾字合律, 对仗度, 出律位置, 合律, 结论 }
}

/**
 * 春联样式预设。皮肤细节（背景红、字色、圆角、描边等）由
 * SpringFestivalCouplets.vue 中对应的 [data-couplet-style] CSS 变量实现，
 * 这里只保留 key 与展示文案，供 store 默认值与设置页选择卡片共用。
 */
export type CoupletStyle = 'classic' | 'silk' | 'festive'

export interface CoupletStylePreset {
  /** 样式 key，同时作为存储值与 data-couplet-style 属性值 */
  value: CoupletStyle
  /** 展示名称 */
  name: string
  /** 一句话说明 */
  desc: string
}

export const DEFAULT_COUPLET_STYLE: CoupletStyle = 'classic'

export const COUPLET_STYLES: CoupletStylePreset[] = [
  { value: 'classic', name: '经典手写', desc: '直角正红 · 黑墨字 · 无边框' },
  { value: 'silk', name: '洒金宣纸', desc: '红底暗纹 · 黑墨字 · 无边框' },
  { value: 'festive', name: '描金喜庆', desc: '正红渐变 · 金边金字' },
]

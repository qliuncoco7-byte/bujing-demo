import { Icon } from './Icon'
import { PROJECT } from '../data/project'

export function TopBar({
  onReset,
  onAbout,
}: {
  onReset: () => void
  onAbout: () => void
}) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="brand">
          <span className="brand-mark">
            <Icon name="leaf" size={17} strokeWidth={2} />
          </span>
          <span className="brand-name">补镜</span>
        </div>
        <span className="topbar-divider" aria-hidden="true" />
        <div className="project-title">
          <strong>{PROJECT.title}</strong>
          <span className="project-meta">
            演示项目 · {PROJECT.duration} 秒 · {PROJECT.aspect}
          </span>
        </div>
      </div>
      <div className="topbar-right">
        <button type="button" className="demo-pill" onClick={onAbout}>
          <Icon name="info" size={14} />
          交互 Demo · AI 解析与生成均为预制示例
        </button>
        <button type="button" className="btn btn-ghost topbar-reset" onClick={onReset}>
          <Icon name="refresh" size={15} />
          重置示例
        </button>
      </div>
    </header>
  )
}

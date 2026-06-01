import { useEffect } from 'react'
import { Icon } from './Icon'

interface Props {
  url: string
  type: string
  name?: string
  onClose: () => void
}

export function MediaViewer({ url, type, name, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const isVideo = type.startsWith('video/')

  return (
    <div className="modal-overlay media-viewer-overlay" onClick={onClose}>
      <div className="media-viewer-content" onClick={e => e.stopPropagation()}>
        <button className="media-viewer-close" onClick={onClose}>
          <Icon name="close" />
        </button>
        {name && <div className="media-viewer-name">{name}</div>}
        {isVideo ? (
          <video src={url} className="media-viewer-video" controls autoPlay />
        ) : (
          <img src={url} alt={name || ''} className="media-viewer-image" />
        )}
        <a href={url} target="_blank" rel="noopener noreferrer" className="media-viewer-download" download={name || undefined}>
          <Icon name="download" />
        </a>
      </div>
    </div>
  )
}

import { useState } from 'react'
import type { Message } from '../types'
import { Icon } from './Icon'
import { MediaViewer } from './MediaViewer'

function getFileIcon(type: string): string {
  if (type.startsWith('image/')) return 'file_image'
  if (type.startsWith('audio/')) return 'file_audio'
  if (type.startsWith('video/')) return 'file_video'
  if (type.includes('zip') || type.includes('rar') || type.includes('tar') || type.includes('7z') || type.includes('gzip')) return 'file_zip'
  return 'file'
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
}

export function FilePreview({ msg }: { msg: Message }) {
  const [viewerOpen, setViewerOpen] = useState(false)

  if (!msg.file_url) return null

  const isImage = msg.file_type?.startsWith('image/')
  const isAudio = msg.file_type?.startsWith('audio/')
  const isVideo = msg.file_type?.startsWith('video/')

  if (isImage) {
    return (
      <>
        <a onClick={() => setViewerOpen(true)} className="msg-image-link" style={{ cursor: 'pointer' }}>
          <img src={msg.file_url} alt={msg.file_name || ''} className="msg-image" />
        </a>
        {viewerOpen && (
          <MediaViewer
            url={msg.file_url}
            type={msg.file_type || 'image/png'}
            name={msg.file_name || undefined}
            onClose={() => setViewerOpen(false)}
          />
        )}
      </>
    )
  }

  if (isAudio) {
    return (
      <div className="msg-audio-wrapper">
        <audio src={msg.file_url} controls className="msg-audio" preload="metadata" />
        <span className="msg-audio-name">{msg.file_name}</span>
      </div>
    )
  }

  if (isVideo) {
    return (
      <>
        <div className="msg-video-wrapper">
          <video
            src={msg.file_url}
            className="msg-video"
            controls
            preload="metadata"
            onClick={() => setViewerOpen(true)}
            style={{ cursor: 'pointer' }}
          />
        </div>
        {viewerOpen && (
          <MediaViewer
            url={msg.file_url}
            type={msg.file_type || 'video/mp4'}
            name={msg.file_name || undefined}
            onClose={() => setViewerOpen(false)}
          />
        )}
      </>
    )
  }

  const sizeStr = msg.file_size ? formatSize(msg.file_size) : ''

  return (
    <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="msg-file-link" download={msg.file_name || undefined}>
      <span className="file-icon"><Icon name={getFileIcon(msg.file_type || '')} /></span>
      <span className="file-info">
        <span className="file-name">{msg.file_name}</span>
        {sizeStr && <span className="file-size">{sizeStr}</span>}
      </span>
      <span className="file-download"><Icon name="download" /></span>
    </a>
  )
}

export { getFileIcon, formatSize }

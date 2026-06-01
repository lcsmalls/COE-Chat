import { useState, useRef, useEffect } from 'react'
import { publicFonts, fontList, getFontFamily, loadFont } from '../utils/fonts'

interface Props {
  value: string
  onChange: (value: string) => void
}

export function FontSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const allFonts = fontList
  const selected = allFonts.find(f => f.name === value) || publicFonts[0]

  return (
    <div className="font-select" ref={ref}>
      <button className="font-select-trigger" onClick={() => setOpen(!open)}>
        <span style={{ fontFamily: getFontFamily(selected.name) }}>
          {selected.label}
        </span>
        <span className="font-select-arrow">▾</span>
      </button>
      {open && (
        <div className="font-select-dropdown">
          {publicFonts.map(f => (
            <button
              key={f.name}
              className={`font-select-option ${f.name === value ? 'active' : ''}`}
              onClick={() => { onChange(f.name); loadFont(f.name); setOpen(false) }}
            >
              <span style={{ fontFamily: getFontFamily(f.name) }}>
                {f.label}
              </span>
              <span className="font-select-category">{f.category}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

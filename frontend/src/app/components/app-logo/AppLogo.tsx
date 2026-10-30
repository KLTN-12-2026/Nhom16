export function AppLogo({ tagline = false, compact = false }: { tagline?: boolean; compact?: boolean }) {
  return (
    <span className={`app-logo${compact ? ' app-logo--compact' : ''}`} aria-label="TopCV">
      <span className="app-logo__word" aria-hidden="true"><b>top</b><strong>CV</strong></span>
      {tagline && <small>Tiếp lợi thế, nối thành công</small>}
    </span>
  )
}

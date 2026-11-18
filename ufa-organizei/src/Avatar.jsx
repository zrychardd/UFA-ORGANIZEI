import { useState } from 'react'

// Círculo de perfil: mostra a foto quando existe; sem foto (ou se ela falhar ao carregar), mostra as iniciais.
// O estilo do círculo (tamanho, cor de fundo, fonte) vem de fora, em `className`.
export default function Avatar({ url, initials, className = '' }) {
  const [failedUrl, setFailedUrl] = useState(null)
  const showPhoto = Boolean(url) && failedUrl !== url

  return (
    <div className={`${className} overflow-hidden`}>
      {showPhoto ? (
        <img src={url} alt="" loading="lazy" draggable={false} className="w-full h-full object-cover" onError={() => setFailedUrl(url)} />
      ) : (
        initials
      )}
    </div>
  )
}

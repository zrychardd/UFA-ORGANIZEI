// Foto de perfil: validação, recorte quadrado e compressão no próprio aparelho antes do envio.
// A foto final tem 256x256 (JPEG, poucos KB), então carrega rápido no feed e gasta pouco armazenamento.

export const AVATAR_BUCKET = 'avatars'
export const AVATAR_SIZE = 256
export const MAX_INPUT_BYTES = 10 * 1024 * 1024
export const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Cada pessoa tem uma única foto, guardada na pasta com o próprio id (as regras do Supabase exigem isso)
export const avatarPath = (userId) => `${userId}/avatar.jpg`

// A URL é sempre a mesma; o parâmetro v força o navegador a buscar a foto nova depois de trocar
export const withCacheBust = (url, stamp = Date.now()) => `${url}${url.includes('?') ? '&' : '?'}v=${stamp}`

export function validateAvatarFile(file) {
  if (!file) return { ok: false, message: 'Nenhum arquivo selecionado.' }
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) return { ok: false, message: 'Use uma imagem JPG, PNG ou WebP.' }
  if (file.size > MAX_INPUT_BYTES) return { ok: false, message: 'A imagem é grande demais (máximo de 10 MB).' }
  return { ok: true, message: '' }
}

// Quadrado centralizado dentro da imagem original
export function squareCropRect(width, height) {
  const size = Math.min(width, height)
  return { sx: Math.floor((width - size) / 2), sy: Math.floor((height - size) / 2), size }
}

async function loadBitmap(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' }) // respeita a rotação das fotos de celular
    } catch {
      try { return await createImageBitmap(file) } catch { /* cai para o <img> */ }
    }
  }
  const url = URL.createObjectURL(file)
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
      img.src = url
    })
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Recorta o centro em quadrado, reduz para outSize x outSize e devolve um Blob JPEG
export async function resizeAvatar(file, outSize = AVATAR_SIZE, quality = 0.85) {
  const bitmap = await loadBitmap(file)
  const width = bitmap.width || bitmap.naturalWidth
  const height = bitmap.height || bitmap.naturalHeight
  const { sx, sy, size } = squareCropRect(width, height)

  const canvas = document.createElement('canvas')
  canvas.width = outSize
  canvas.height = outSize
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff' // fundo branco para PNG com transparência
  ctx.fillRect(0, 0, outSize, outSize)
  ctx.drawImage(bitmap, sx, sy, size, size, 0, 0, outSize, outSize)
  bitmap.close?.()

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Não foi possível processar a imagem.'))), 'image/jpeg', quality)
  })
}

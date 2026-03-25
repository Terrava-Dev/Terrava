export const getImageUrl = (path: string) => {
  const base = import.meta.env.VITE_API_URL?.replace('/api', '') ?? ''
  const clean = path?.replace(/^\/?(uploads\/)?/, '')
  return `${base}/uploads/${clean}`
}
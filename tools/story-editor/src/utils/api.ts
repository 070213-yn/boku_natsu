const BASE_URL = '/api'

export async function fetchData<T>(filename: string): Promise<T> {
  const res = await fetch(`${BASE_URL}/data/${filename}`)
  if (!res.ok) throw new Error(`データの読み込みに失敗: ${filename}`)
  return res.json()
}

export async function saveData<T>(filename: string, data: T): Promise<void> {
  const res = await fetch(`${BASE_URL}/data/${filename}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`データの保存に失敗: ${filename}`)
}

export async function exportAll(): Promise<string[]> {
  const res = await fetch(`${BASE_URL}/export/all`, { method: 'POST' })
  if (!res.ok) throw new Error('エクスポートに失敗')
  const data = await res.json()
  return data.exported
}

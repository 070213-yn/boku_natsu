import { useEffect, useRef } from 'react'

export function useAutoSave(data: unknown, saveFn: () => Promise<void>, delay = 2000) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFirstRender = useRef(true)
  const prevDataRef = useRef<string>('')

  useEffect(() => {
    // 初回レンダリングは保存しない
    if (isFirstRender.current) {
      isFirstRender.current = false
      prevDataRef.current = JSON.stringify(data)
      return
    }

    const currentData = JSON.stringify(data)
    // データが変わっていなければ何もしない
    if (currentData === prevDataRef.current) return
    prevDataRef.current = currentData

    // デバウンス: 前のタイマーをクリアして新しいタイマーをセット
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      saveFn()
    }, delay)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [data, saveFn, delay])
}

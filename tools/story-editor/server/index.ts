import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { dataRouter } from './routes/data'
import { eventsRouter } from './routes/events'
import { uploadsRouter } from './routes/uploads'
import { eventflowRouter } from './routes/eventflow'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.use('/api/data', dataRouter)
app.use('/api/events', eventsRouter)
app.use('/api/uploads', uploadsRouter)
app.use('/api/eventflow', eventflowRouter)

// Unity向け一括エクスポート（JSON + EventList C# + EventFlow C#）
app.post('/api/export/all', async (req, res) => {
  const fs = await import('fs/promises')

  const dataDir = path.resolve(__dirname, '../data')
  const unityDataDir = path.resolve(__dirname, '../../Assets/_Project/Data')

  try {
    // 1. JSONエクスポート
    await fs.mkdir(unityDataDir, { recursive: true })
    const files = await fs.readdir(dataDir)
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.includes('template'))

    for (const file of jsonFiles) {
      const content = await fs.readFile(path.join(dataDir, file), 'utf-8')
      await fs.writeFile(path.join(unityDataDir, file), content, 'utf-8')
    }

    // 2. EventFlow → DayFlow C# 生成（内部APIを呼び出し）
    let eventFlowResult = null
    try {
      const response = await fetch(`http://localhost:${PORT}/api/eventflow/sync`, { method: 'POST' })
      eventFlowResult = await response.json()
    } catch (err) {
      eventFlowResult = { success: false, error: `EventFlow同期エラー: ${err}` }
    }

    res.json({
      success: true,
      exported: jsonFiles,
      eventFlow: eventFlowResult,
    })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

app.listen(PORT, () => {
  console.log(`[Story Editor Server] http://localhost:${PORT} で起動中`)
})

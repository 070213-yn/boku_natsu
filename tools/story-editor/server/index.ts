import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { dataRouter } from './routes/data'
import { eventsRouter } from './routes/events'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.use('/api/data', dataRouter)
app.use('/api/events', eventsRouter)

// Unity向けJSON一括エクスポート
app.post('/api/export/all', async (req, res) => {
  const fs = await import('fs/promises')

  const dataDir = path.resolve(__dirname, '../data')
  const unityDataDir = path.resolve(__dirname, '../../Assets/_Project/Data')

  try {
    await fs.mkdir(unityDataDir, { recursive: true })
    const files = await fs.readdir(dataDir)
    const jsonFiles = files.filter(f => f.endsWith('.json') && !f.includes('template'))

    for (const file of jsonFiles) {
      const content = await fs.readFile(path.join(dataDir, file), 'utf-8')
      await fs.writeFile(path.join(unityDataDir, file), content, 'utf-8')
    }

    res.json({ success: true, exported: jsonFiles })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

app.listen(PORT, () => {
  console.log(`[Story Editor Server] http://localhost:${PORT} で起動中`)
})

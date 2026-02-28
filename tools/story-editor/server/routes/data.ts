import { Router } from 'express'
import fs from 'fs/promises'
import path from 'path'

export const dataRouter = Router()

const DATA_DIR = path.resolve(__dirname, '../../data')
const TEMPLATE_DIR = path.resolve(__dirname, '../../data/templates')

// JSONファイルを読み込む
dataRouter.get('/:filename', async (req, res) => {
  const { filename } = req.params
  const filePath = path.join(DATA_DIR, `${filename}.json`)
  const templatePath = path.join(TEMPLATE_DIR, `${filename}.json`)

  try {
    // まずデータディレクトリを確認、なければテンプレートを返す
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      res.json(JSON.parse(content))
    } catch {
      // テンプレートから初期データを作成
      try {
        const template = await fs.readFile(templatePath, 'utf-8')
        await fs.mkdir(DATA_DIR, { recursive: true })
        await fs.writeFile(filePath, template, 'utf-8')
        res.json(JSON.parse(template))
      } catch {
        res.json({}) // テンプレートもなければ空オブジェクト
      }
    }
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// JSONファイルを保存
dataRouter.post('/:filename', async (req, res) => {
  const { filename } = req.params
  const filePath = path.join(DATA_DIR, `${filename}.json`)

  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    const data = { ...req.body, lastModified: new Date().toISOString() }
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
    res.json({ success: true, lastModified: data.lastModified })
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

// 全JSONファイルの状態を取得
dataRouter.get('/', async (_req, res) => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
    const files = await fs.readdir(DATA_DIR)
    const jsonFiles = files.filter(f => f.endsWith('.json'))

    const statuses = await Promise.all(jsonFiles.map(async (file) => {
      const stat = await fs.stat(path.join(DATA_DIR, file))
      return { name: file.replace('.json', ''), lastModified: stat.mtime.toISOString() }
    }))

    res.json(statuses)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

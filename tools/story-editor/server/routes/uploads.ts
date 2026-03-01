import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()

// 画像保存先ディレクトリ
const IMAGES_DIR = path.resolve(__dirname, '../../data/characters/images')

// ディレクトリが存在しなければ作成
async function ensureDir() {
  await fs.mkdir(IMAGES_DIR, { recursive: true })
}

// multer設定
const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    await ensureDir()
    cb(null, IMAGES_DIR)
  },
  filename: (_req, file, cb) => {
    // タイムスタンプ + 元のファイル名で一意にする
    const uniqueName = `${Date.now()}_${file.originalname}`
    cb(null, uniqueName)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB上限
  fileFilter: (_req, file, cb) => {
    // 画像ファイルのみ許可
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('画像ファイルのみアップロードできます'))
    }
  },
})

// POST /api/uploads/characters - 画像アップロード
router.post('/characters', upload.single('image'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'ファイルが選択されていません' })
    return
  }
  const filePath = `/api/uploads/characters/${req.file.filename}`
  res.json({ success: true, path: filePath, filename: req.file.filename })
})

// GET /api/uploads/characters/:filename - 画像配信
router.get('/characters/:filename', async (req, res) => {
  const filePath = path.join(IMAGES_DIR, req.params.filename)
  try {
    await fs.access(filePath)
    res.sendFile(filePath)
  } catch {
    res.status(404).json({ error: 'ファイルが見つかりません' })
  }
})

// DELETE /api/uploads/characters/:filename - 画像削除
router.delete('/characters/:filename', async (req, res) => {
  const filePath = path.join(IMAGES_DIR, req.params.filename)
  try {
    await fs.unlink(filePath)
    res.json({ success: true })
  } catch {
    res.status(404).json({ error: 'ファイルが見つかりません' })
  }
})

export { router as uploadsRouter }

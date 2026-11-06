const multer = require('multer')
const mongoose = require('mongoose')

const MAX_SIZE = 6 * 1024 * 1024 // 6MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      return cb(new Error('Only JPEG/PNG/WEBP/GIF images are allowed'))
    }
    cb(null, true)
  }
})

const bucket = () =>
  new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'images' })

function saveToGridFS(file) {
  return new Promise((resolve, reject) => {
    const safeName = (file.originalname || 'image').replace(/[^\w.\-]/g, '_').slice(-60)
    const filename = `${Date.now()}-${safeName}`
    const stream = bucket().openUploadStream(filename, { contentType: file.mimetype })
    stream.on('error', reject)
    stream.on('finish', () => resolve(stream.id))
    stream.end(file.buffer)
  })
}

/** 注册图片上传相关路由：POST /upload、GET /images/:id */
function registerImageRoutes(app) {
  app.post('/upload', (req, res) => {
    upload.single('file')(req, res, async (err) => {
      if (err) return res.status(400).json({ error: err.message })
      if (!req.file) return res.status(400).json({ error: 'No file uploaded (field name must be "file")' })
      try {
        const id = await saveToGridFS(req.file)
        const base = `${req.protocol}://${req.get('host')}`
        res.json({
          _id: id.toString(),
          url: `${base}/images/${id}`,
          filename: req.file.originalname,
          size: req.file.size,
          contentType: req.file.mimetype
        })
      } catch (e) {
        res.status(500).json({ error: e.message })
      }
    })
  })

  app.get('/images/:id', async (req, res) => {
    let id
    try {
      id = new mongoose.Types.ObjectId(req.params.id)
    } catch (e) {
      return res.status(400).json({ error: 'Invalid image id' })
    }
    try {
      const [meta] = await bucket().find({ _id: id }).limit(1).toArray()
      if (!meta) return res.status(404).json({ error: 'Image not found' })
      res.set('Content-Type', meta.contentType || 'application/octet-stream')
      res.set('Cache-Control', 'public, max-age=31536000, immutable')
      bucket().openDownloadStream(id).pipe(res)
    } catch (e) {
      res.status(500).json({ error: e.message })
    }
  })
}

module.exports = { registerImageRoutes }

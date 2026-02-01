const express = require('express');
const router = express.Router();
const controller = require('../controllers/musicaController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  }
});

// Middleware para tratar erros do multer
const handleMulterError = (err, req, res, next) => {
  if (err) {
    console.error('Erro do Multer:', err);
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Arquivo muito grande. Tamanho máximo: 100MB' });
      }
      return res.status(400).json({ error: 'Erro ao fazer upload do arquivo', details: err.message });
    }
    return res.status(400).json({ error: 'Erro ao processar arquivo', details: err.message });
  }
  next();
};

router.post('/', (req, res, next) => {
  console.log('Recebendo requisição POST /musicas');
  console.log('Body:', req.body);
  console.log('File:', req.file);
  next();
}, upload.single('arquivo'), handleMulterError, controller.criarMusica);
router.post('/youtube', controller.baixarYoutube);
router.get('/', controller.listarMusicas);
router.get('/categoria/:id', controller.listarPorCategoria);
router.put('/:id', controller.atualizarMusica);
router.delete('/:id', controller.deletarMusica);

module.exports = router; 
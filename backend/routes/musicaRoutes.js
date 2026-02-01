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

const upload = multer({ storage });

router.post('/', upload.single('arquivo'), controller.criarMusica);
router.post('/youtube', controller.baixarYoutube);
router.get('/', controller.listarMusicas);
router.get('/categoria/:id', controller.listarPorCategoria);
router.put('/:id', controller.atualizarMusica);
router.delete('/:id', controller.deletarMusica);

module.exports = router; 
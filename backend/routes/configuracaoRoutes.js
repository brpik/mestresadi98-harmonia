const express = require('express');
const router = express.Router();
const controller = require('../controllers/configuracaoController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, 'logo_' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

router.post('/logo', upload.single('logo'), controller.uploadLogo);
router.get('/logo', controller.obterLogo);

module.exports = router; 
const express = require('express');
const router = express.Router();
const controller = require('../controllers/categoriaController');

router.post('/', controller.criarCategoria);
router.get('/', controller.listarCategorias);
router.put('/:id', controller.atualizarCategoria);
router.delete('/:id', controller.deletarCategoria);

module.exports = router; 
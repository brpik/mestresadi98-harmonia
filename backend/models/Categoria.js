const mongoose = require('mongoose');

const CategoriaSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  dataCriacao: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Categoria', CategoriaSchema); 
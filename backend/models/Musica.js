const mongoose = require('mongoose');

const MusicaSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  categoria: { type: mongoose.Schema.Types.ObjectId, ref: 'Categoria' },
  caminho: { type: String, required: true },
  dataCriacao: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Musica', MusicaSchema); 
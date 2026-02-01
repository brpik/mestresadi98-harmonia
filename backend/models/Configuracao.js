const mongoose = require('mongoose');

const ConfiguracaoSchema = new mongoose.Schema({
  _id: { type: String, default: "config-logo" }, // sempre o mesmo id
  logo: { type: String, required: true },
  dataAtualizacao: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Configuracao', ConfiguracaoSchema); 
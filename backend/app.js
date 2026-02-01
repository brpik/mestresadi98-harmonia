const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const categoriaRoutes = require('./routes/categoriaRoutes');
const musicaRoutes = require('./routes/musicaRoutes');
const configuracaoRoutes = require('./routes/configuracaoRoutes');

app.use('/api/categorias', categoriaRoutes);
app.use('/api/musicas', musicaRoutes);
app.use('/api/config', configuracaoRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
}).catch(err => console.error(err)); 
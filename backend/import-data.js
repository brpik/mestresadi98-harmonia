const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const Musica = require('./models/Musica');
const Categoria = require('./models/Categoria');

// Conectar ao MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Conectado ao MongoDB');
  
  try {
    // Limpar dados existentes
    await Musica.deleteMany({});
    await Categoria.deleteMany({});
    console.log('Dados antigos removidos');
    
    // Importar categorias
    const categoriasPath = path.join(__dirname, '..', 'harmornia.categorias.json');
    if (fs.existsSync(categoriasPath)) {
      const categoriasData = JSON.parse(fs.readFileSync(categoriasPath, 'utf8'));
      
      // Converter formato MongoDB export para formato do modelo
      const categoriasToInsert = categoriasData.map(cat => ({
        _id: cat._id.$oid,
        titulo: cat.titulo,
        dataCriacao: cat.dataCriacao ? new Date(cat.dataCriacao.$date) : new Date()
      }));
      
      await Categoria.insertMany(categoriasToInsert);
      console.log(`✅ ${categoriasToInsert.length} categorias importadas`);
    } else {
      console.log('⚠️ Arquivo de categorias não encontrado');
    }
    
    // Importar músicas
    const musicasPath = path.join(__dirname, '..', 'harmornia.musicas.json');
    if (fs.existsSync(musicasPath)) {
      const musicasData = JSON.parse(fs.readFileSync(musicasPath, 'utf8'));
      
      // Converter formato MongoDB export para formato do modelo
      const musicasToInsert = musicasData.map(mus => ({
        _id: mus._id.$oid,
        titulo: mus.titulo,
        categoria: mus.categoria.$oid,
        caminho: mus.caminho,
        dataCriacao: mus.dataCriacao ? new Date(mus.dataCriacao.$date) : new Date()
      }));
      
      await Musica.insertMany(musicasToInsert);
      console.log(`✅ ${musicasToInsert.length} músicas importadas`);
    } else {
      console.log('⚠️ Arquivo de músicas não encontrado');
    }
    
    console.log('✅ Importação concluída com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao importar dados:', error);
    process.exit(1);
  }
}).catch(err => {
  console.error('❌ Erro ao conectar ao MongoDB:', err);
  process.exit(1);
});

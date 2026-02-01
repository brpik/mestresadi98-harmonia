/**
 * Script de Seed para popular o MongoDB
 * 
 * Uso:
 *   node backend/seed.js                    # Importa dados (não limpa existentes)
 *   node backend/seed.js --clean             # Limpa dados existentes antes de importar
 *   node backend/seed.js --reset            # Limpa tudo e importa do zero
 * 
 * Variáveis de ambiente necessárias:
 *   MONGO_URI - URI de conexão do MongoDB
 */

const mongoose = require('mongoose');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const Musica = require('./models/Musica');
const Categoria = require('./models/Categoria');
const Configuracao = require('./models/Configuracao');

// Verifica argumentos da linha de comando
const args = process.argv.slice(2);
const shouldClean = args.includes('--clean') || args.includes('--reset');
const shouldReset = args.includes('--reset');

// Função para converter formato MongoDB export para formato do modelo
function convertMongoId(obj) {
  if (obj && obj.$oid) {
    return obj.$oid;
  }
  return obj;
}

function convertMongoDate(obj) {
  if (obj && obj.$date) {
    return new Date(obj.$date);
  }
  return obj ? new Date(obj) : new Date();
}

async function seedDatabase() {
  try {
    // Conectar ao MongoDB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/harmonia';
    console.log('🔌 Conectando ao MongoDB...');
    console.log(`   URI: ${mongoUri.replace(/\/\/.*@/, '//***:***@')}`); // Oculta credenciais
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ Conectado ao MongoDB\n');

    // Limpar dados existentes se solicitado
    if (shouldReset || shouldClean) {
      console.log('🗑️  Limpando dados existentes...');
      await Musica.deleteMany({});
      await Categoria.deleteMany({});
      await Configuracao.deleteMany({});
      console.log('✅ Dados antigos removidos\n');
    }

    // Importar categorias
    console.log('📂 Importando categorias...');
    const categoriasPath = path.join(__dirname, '..', 'harmornia.categorias.json');
    
    if (!fs.existsSync(categoriasPath)) {
      console.log('⚠️  Arquivo de categorias não encontrado:', categoriasPath);
    } else {
      const categoriasData = JSON.parse(fs.readFileSync(categoriasPath, 'utf8'));
      
      // Verificar se já existem categorias
      const existingCategories = await Categoria.countDocuments();
      if (existingCategories > 0 && !shouldClean && !shouldReset) {
        console.log(`⚠️  Já existem ${existingCategories} categorias. Use --clean ou --reset para substituir.`);
      } else {
        const categoriasToInsert = categoriasData.map(cat => ({
          _id: convertMongoId(cat._id),
          titulo: cat.titulo,
          dataCriacao: convertMongoDate(cat.dataCriacao)
        }));
        
        await Categoria.insertMany(categoriasToInsert, { ordered: false });
        console.log(`✅ ${categoriasToInsert.length} categorias importadas`);
      }
    }

    // Importar músicas
    console.log('\n📂 Importando músicas...');
    const musicasPath = path.join(__dirname, '..', 'harmornia.musicas.json');
    
    if (!fs.existsSync(musicasPath)) {
      console.log('⚠️  Arquivo de músicas não encontrado:', musicasPath);
    } else {
      const musicasData = JSON.parse(fs.readFileSync(musicasPath, 'utf8'));
      
      // Filtrar músicas grandes que foram removidas
      const musicasFiltradas = musicasData.filter(mus => {
        const caminho = mus.caminho || '';
        return !caminho.includes('musica_1743612137380') && 
               !caminho.includes('musica_1743612960165');
      });
      
      if (musicasFiltradas.length < musicasData.length) {
        console.log(`⚠️  ${musicasData.length - musicasFiltradas.length} músicas grandes foram filtradas`);
      }
      
      // Verificar se já existem músicas
      const existingMusics = await Musica.countDocuments();
      if (existingMusics > 0 && !shouldClean && !shouldReset) {
        console.log(`⚠️  Já existem ${existingMusics} músicas. Use --clean ou --reset para substituir.`);
      } else {
        const musicasToInsert = musicasFiltradas.map(mus => ({
          _id: convertMongoId(mus._id),
          titulo: mus.titulo,
          categoria: convertMongoId(mus.categoria),
          caminho: mus.caminho,
          dataCriacao: convertMongoDate(mus.dataCriacao)
        }));
        
        // Inserir em lotes para evitar problemas de memória
        const batchSize = 100;
        let inserted = 0;
        
        for (let i = 0; i < musicasToInsert.length; i += batchSize) {
          const batch = musicasToInsert.slice(i, i + batchSize);
          try {
            await Musica.insertMany(batch, { ordered: false });
            inserted += batch.length;
            console.log(`   Progresso: ${inserted}/${musicasToInsert.length} músicas`);
          } catch (error) {
            // Ignora erros de duplicação
            if (error.code !== 11000) {
              console.error(`   Erro ao inserir lote ${i / batchSize + 1}:`, error.message);
            }
          }
        }
        
        console.log(`✅ ${inserted} músicas importadas`);
      }
    }

    // Importar configurações (se existir)
    console.log('\n📂 Verificando configurações...');
    const configPath = path.join(__dirname, '..', 'harmornia.configuracaos.json');
    
    if (fs.existsSync(configPath)) {
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      if (configData.length > 0) {
        const configToInsert = configData.map(config => ({
          _id: convertMongoId(config._id),
          logo: config.logo,
          dataCriacao: convertMongoDate(config.dataCriacao)
        }));
        
        await Configuracao.deleteMany({});
        await Configuracao.insertMany(configToInsert);
        console.log(`✅ ${configToInsert.length} configurações importadas`);
      }
    } else {
      console.log('⚠️  Arquivo de configurações não encontrado (opcional)');
    }

    // Estatísticas finais
    console.log('\n📊 Estatísticas:');
    const totalCategorias = await Categoria.countDocuments();
    const totalMusicas = await Musica.countDocuments();
    const totalConfigs = await Configuracao.countDocuments();
    
    console.log(`   Categorias: ${totalCategorias}`);
    console.log(`   Músicas: ${totalMusicas}`);
    console.log(`   Configurações: ${totalConfigs}`);
    
    console.log('\n✅ Seed concluído com sucesso!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Erro ao executar seed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexão com MongoDB fechada');
  }
}

// Executar seed
seedDatabase();

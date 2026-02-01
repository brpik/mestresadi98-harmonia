const Musica = require('../models/Musica');
const Categoria = require('../models/Categoria');
const path = require('path');
const { exec } = require('child_process');
const mongoose = require('mongoose');

// Função para validar e limpar URL do YouTube
function validarUrlYoutube(url) {
  try {
    // Padrão para identificar URLs do YouTube
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    
    if (!youtubeRegex.test(url)) {
      return null;
    }

    // Extrair o ID do vídeo (parâmetro v)
    const videoIdMatch = url.match(/[?&]v=([^&]+)/);
    if (!videoIdMatch) {
      return null;
    }

    // Retornar URL limpa apenas com o ID do vídeo
    return `https://www.youtube.com/watch?v=${videoIdMatch[1]}`;
  } catch (error) {
    console.error('Erro ao validar URL:', error);
    return null;
  }
}

exports.criarMusica = async (req, res) => {
  try {
    console.log('=== Iniciando criação de música ===');
    console.log('req.body:', req.body);
    console.log('req.file:', req.file);
    
    const { titulo, categoria } = req.body;
    
    // Validação básica
    if (!titulo || !titulo.trim()) {
      console.log('Erro: Título não fornecido');
      return res.status(400).json({ 
        error: 'Título é obrigatório' 
      });
    }

    if (!categoria) {
      return res.status(400).json({ 
        error: 'Categoria é obrigatória' 
      });
    }

    // Validar se categoria é um ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(categoria)) {
      return res.status(400).json({ 
        error: 'ID de categoria inválido' 
      });
    }

    // Verificar se a categoria existe
    const categoriaExiste = await Categoria.findById(categoria);
    if (!categoriaExiste) {
      return res.status(404).json({ 
        error: 'Categoria não encontrada' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        error: 'Arquivo de áudio é obrigatório' 
      });
    }

    // Normalizar o caminho do arquivo para usar caminho relativo
    const filePath = req.file.path;
    // Extrair apenas o nome do arquivo e criar caminho relativo
    const fileName = path.basename(filePath);
    const caminho = `uploads/${fileName}`;
    
    const nova = new Musica({ 
      titulo: titulo.trim(), 
      categoria, 
      caminho 
    });
    
    await nova.save();
    
    // Popular a categoria antes de retornar
    await nova.populate('categoria');
    
    res.status(201).json(nova);
  } catch (error) {
    console.error('Erro ao criar música:', error);
    console.error('Stack trace:', error.stack);
    
    // Tratar erros específicos do Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(400).json({ 
        error: 'Erro de validação',
        details: errors.join(', ')
      });
    }
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        error: 'ID inválido',
        details: error.message 
      });
    }
    
    res.status(500).json({ 
      error: 'Erro ao criar música',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

exports.listarMusicas = async (req, res) => {
  try {
    const musicas = await Musica.find().populate('categoria');
    res.json(musicas);
  } catch (error) {
    console.error('Erro ao listar músicas:', error);
    res.status(500).json({ 
      error: 'Erro ao listar músicas',
      details: error.message 
    });
  }
};

exports.listarPorCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const musicas = await Musica.find({ categoria: id });
    res.json(musicas);
  } catch (error) {
    console.error('Erro ao listar músicas por categoria:', error);
    res.status(500).json({ 
      error: 'Erro ao listar músicas por categoria',
      details: error.message 
    });
  }
};

exports.atualizarMusica = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, categoria } = req.body;
    const atualizada = await Musica.findByIdAndUpdate(id, { titulo, categoria }, { new: true });
    if (!atualizada) {
      return res.status(404).json({ error: 'Música não encontrada' });
    }
    res.json(atualizada);
  } catch (error) {
    console.error('Erro ao atualizar música:', error);
    res.status(500).json({ 
      error: 'Erro ao atualizar música',
      details: error.message 
    });
  }
};

exports.deletarMusica = async (req, res) => {
  try {
    const { id } = req.params;
    const deletada = await Musica.findByIdAndDelete(id);
    if (!deletada) {
      return res.status(404).json({ error: 'Música não encontrada' });
    }
    res.sendStatus(204);
  } catch (error) {
    console.error('Erro ao deletar música:', error);
    res.status(500).json({ 
      error: 'Erro ao deletar música',
      details: error.message 
    });
  }
};

exports.baixarYoutube = async (req, res) => {
  try {
    const { url, titulo, categoria } = req.body;

    // Validar e limpar a URL
    const urlLimpa = validarUrlYoutube(url);
    if (!urlLimpa) {
      return res.status(400).json({ 
        error: 'URL inválida. Forneça uma URL válida do YouTube.' 
      });
    }

    const timestamp = Date.now();
    const outputDir = path.join(__dirname, '..', 'uploads');
    const outputFile = `musica_${timestamp}.mp3`;
    const fullPath = path.join(outputDir, outputFile);

    // Encontrar o caminho completo do yt-dlp
    const { execSync } = require('child_process');
    let ytDlpPath = 'yt-dlp';
    try {
      ytDlpPath = execSync('which yt-dlp', { encoding: 'utf-8' }).trim();
    } catch (e) {
      // Se não encontrar, tenta usar o caminho padrão do Homebrew
      ytDlpPath = '/opt/homebrew/bin/yt-dlp';
    }

    const comando = `"${ytDlpPath}" -x --audio-format mp3 -o "${outputDir}/musica_${timestamp}.%(ext)s" "${urlLimpa}"`;

    exec(comando, { 
      env: { ...process.env, PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin' }
    }, async (err, stdout, stderr) => {
      if (err) {
        console.error('Erro ao baixar:', stderr);
        return res.status(500).json({ error: 'Erro ao baixar áudio do YouTube' });
      }

      const musica = new Musica({
        titulo,
        categoria,
        caminho: `uploads/${outputFile}`
      });

      await musica.save();
      res.status(201).json(musica);
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro interno ao processar YouTube' });
  }
}; 
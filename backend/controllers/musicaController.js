const Musica = require('../models/Musica');
const path = require('path');
const { exec } = require('child_process');

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
    const { titulo, categoria } = req.body;
    
    // Validação básica
    if (!titulo || !categoria) {
      return res.status(400).json({ 
        error: 'Título e categoria são obrigatórios' 
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
    
    const nova = new Musica({ titulo, categoria, caminho });
    await nova.save();
    res.status(201).json(nova);
  } catch (error) {
    console.error('Erro ao criar música:', error);
    res.status(500).json({ 
      error: 'Erro ao criar música',
      details: error.message 
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

    const comando = `yt-dlp -x --audio-format mp3 -o "${outputDir}/musica_${timestamp}.%(ext)s" "${urlLimpa}"`;

    exec(comando, async (err, stdout, stderr) => {
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
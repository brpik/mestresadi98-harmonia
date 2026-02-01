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
  const { titulo, categoria } = req.body;
  const caminho = req.file.path;
  const nova = new Musica({ titulo, categoria, caminho });
  await nova.save();
  res.status(201).json(nova);
};

exports.listarMusicas = async (req, res) => {
  const musicas = await Musica.find().populate('categoria');
  res.json(musicas);
};

exports.listarPorCategoria = async (req, res) => {
  const { id } = req.params;
  const musicas = await Musica.find({ categoria: id });
  res.json(musicas);
};

exports.atualizarMusica = async (req, res) => {
  const { id } = req.params;
  const { titulo, categoria } = req.body;
  const atualizada = await Musica.findByIdAndUpdate(id, { titulo, categoria }, { new: true });
  res.json(atualizada);
};

exports.deletarMusica = async (req, res) => {
  const { id } = req.params;
  await Musica.findByIdAndDelete(id);
  res.sendStatus(204);
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
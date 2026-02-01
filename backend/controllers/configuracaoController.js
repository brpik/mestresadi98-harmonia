const Configuracao = require('../models/Configuracao');

exports.uploadLogo = async (req, res) => {
  try {
    const logoPath = req.file.path;

    const updated = await Configuracao.findByIdAndUpdate(
      'config-logo',
      { logo: logoPath, dataAtualizacao: new Date() },
      { upsert: true, new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar logo' });
  }
};

exports.obterLogo = async (req, res) => {
  try {
    const config = await Configuracao.findById('config-logo');
    if (!config) {
      return res.status(200).json({ logo: null });
    }

    res.json({ logo: config.logo });
  } catch (err) {
    res.status(200).json({ logo: null });
  }
}; 
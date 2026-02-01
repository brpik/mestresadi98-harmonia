const Categoria = require('../models/Categoria');

exports.criarCategoria = async (req, res) => {
  const { titulo } = req.body;
  const nova = new Categoria({ titulo });
  await nova.save();
  res.status(201).json(nova);
};

exports.listarCategorias = async (req, res) => {
  const categorias = await Categoria.find();
  res.json(categorias);
};

exports.atualizarCategoria = async (req, res) => {
  const { id } = req.params;
  const { titulo } = req.body;
  const atualizada = await Categoria.findByIdAndUpdate(id, { titulo }, { new: true });
  res.json(atualizada);
};

exports.deletarCategoria = async (req, res) => {
  const { id } = req.params;
  await Categoria.findByIdAndDelete(id);
  res.sendStatus(204);
}; 
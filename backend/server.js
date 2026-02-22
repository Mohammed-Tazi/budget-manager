const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Récupération de la variable d'environnement configurée sur Vercel
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
  .then(() => console.log("✅ MongoDB connecté"))
  .catch(err => console.error("❌ Erreur MongoDB:", err));

// Définition du schéma
const Transaction = mongoose.model('Transaction', new mongoose.Schema({
    text: String,
    amount: Number,
    category: String,
    type: String,
    date: { type: Date, default: Date.now }
}));

// Routes API
app.get('/api/transactions', async (req, res) => {
    const tx = await Transaction.find().sort({ date: -1 });
    res.json(tx);
});

app.post('/api/transactions', async (req, res) => {
    const newTx = new Transaction(req.body);
    await newTx.save();
    res.json(newTx);
});

app.delete('/api/transactions/:id', async (req, res) => {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: "Supprimé" });
});

// IMPORTANT : Pas de app.listen() pour Vercel
module.exports = app;
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Connexion MongoDB via variable d'environnement Vercel
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
  .then(() => console.log("✅ MongoDB connecté avec succès"))
  .catch(err => console.error("❌ Erreur de connexion MongoDB :", err));

/* --- MODÈLES --- */
const Transaction = mongoose.model('Transaction', new mongoose.Schema({
    text: String,
    amount: Number,
    category: String,
    type: String, // 'income' ou 'expense'
    date: { type: Date, default: Date.now }
}));

const Budget = mongoose.model('Budget', new mongoose.Schema({
    category: String,
    limit: Number
}));

/* --- ROUTES API --- */

// Transactions
app.get('/api/transactions', async (req, res) => {
    try {
        const tx = await Transaction.find().sort({ date: -1 });
        res.json(tx);
    } catch (err) { res.status(500).json(err); }
});

app.post('/api/transactions', async (req, res) => {
    try {
        const newTx = new Transaction(req.body);
        await newTx.save();
        res.json(newTx);
    } catch (err) { res.status(500).json(err); }
});

app.delete('/api/transactions/:id', async (req, res) => {
    try {
        await Transaction.findByIdAndDelete(req.params.id);
        res.json({ message: "Supprimé" });
    } catch (err) { res.status(500).json(err); }
});

// Budgets
app.get('/api/budgets', async (req, res) => {
    try {
        const budgets = await Budget.find();
        res.json(budgets);
    } catch (err) { res.status(500).json(err); }
});

app.post('/api/budgets', async (req, res) => {
    try {
        const newBudget = new Budget(req.body);
        await newBudget.save();
        res.json(newBudget);
    } catch (err) { res.status(500).json(err); }
});

// Export pour Vercel (PAS de app.listen)
module.exports = app;
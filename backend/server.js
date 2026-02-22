const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
<<<<<<< HEAD
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Connexion à MongoDB (en local pour l'instant)
mongoose.connect('mongodb://127.0.0.1:27017/budgetDB')
    .then(() => console.log("✅ Connecté à MongoDB"))
    .catch(err => console.error("❌ Erreur de connexion", err));

// --- SCHÉMAS ---
const Transaction = mongoose.model('Transaction', {
    title: String, amount: Number, category: String, type: String, date: { type: Date, default: Date.now }
});

const Budget = mongoose.model('Budget', { category: String, limit: Number });

const Goal = mongoose.model('Goal', { name: String, target: Number, saved: Number });

// --- ROUTES ---

// Transactions
app.get('/api/transactions', async (req, res) => res.json(await Transaction.find()));
app.post('/api/transactions', async (req, res) => res.json(await new Transaction(req.body).save()));
app.delete('/api/transactions/:id', async (req, res) => {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: "Supprimé" });
});

// Budgets
app.get('/api/budgets', async (req, res) => res.json(await Budget.find()));
app.post('/api/budgets', async (req, res) => {
    const { category, limit } = req.body;
    const updated = await Budget.findOneAndUpdate({ category }, { limit }, { upsert: true, new: true });
    res.json(updated);
});

// Objectifs
app.get('/api/goals', async (req, res) => res.json(await Goal.find()));
app.post('/api/goals', async (req, res) => res.json(await new Goal(req.body).save()));

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Serveur backend sur http://localhost:${PORT}`));
=======

const app = express();

// Configuration des middlewares
app.use(express.json());
app.use(cors());

// --- TA CONNEXION MONGODB ATLAS ---
const MONGO_URI = "mongodb+srv://Mohammedtazix:8Db9016f@cluster0.zqd3ws4.mongodb.net/budgetDB?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ RÉUSSI : Ton site est connecté au Cloud MongoDB Atlas !"))
    .catch(err => console.error("❌ ERREUR de connexion :", err));

// --- MODÈLE DE DONNÉES ---
const TransactionSchema = new mongoose.Schema({
    text: String,
    amount: Number,
    type: String, // 'income' ou 'expense'
    category: String,
    date: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', TransactionSchema);

// --- ROUTES API ---

// 1. Récupérer les transactions
app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// 2. Ajouter une transaction
app.post('/api/transactions', async (req, res) => {
    try {
        const newTx = new Transaction(req.body);
        await newTx.save();
        res.json(newTx);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 3. Supprimer une transaction
app.delete('/api/transactions/:id', async (req, res) => {
    try {
        await Transaction.findByIdAndDelete(req.params.id);
        res.json({ message: "Transaction supprimée" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Lancement du serveur
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});s
>>>>>>> mohammed

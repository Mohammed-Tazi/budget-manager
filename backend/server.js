const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

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
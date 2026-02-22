const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Autoriser le partage de données entre le frontend et le backend
app.use(express.json());
app.use(cors());

// --- CONFIGURATION MONGODB ATLAS ---
// REMPLACE 'TON_MOT_DE_PASSE' par le mot de passe de l'utilisateur Mohammedtazix
const MONGO_URI = "mongodb+srv://Mohammedtazix:TON_MOT_DE_PASSE@cluster0.zqd3ws4.mongodb.net/budgetDB?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Connecté à ton Cloud MongoDB Atlas !"))
    .catch(err => console.error("❌ Erreur de connexion au Cloud :", err));

// --- STRUCTURE DES DONNÉES (Schema) ---
const TransactionSchema = new mongoose.Schema({
    text: String,
    amount: Number,
    type: String, // 'income' ou 'expense'
    category: String,
    date: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', TransactionSchema);

// --- ROUTES POUR TON SITE (API) ---

// Récupérer la liste des transactions
app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ date: -1 });
        res.json(transactions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ajouter une nouvelle transaction
app.post('/api/transactions', async (req, res) => {
    try {
        const newTx = new Transaction(req.body);
        await newTx.save();
        res.json(newTx);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Supprimer une transaction
app.delete('/api/transactions/:id', async (req, res) => {
    try {
        await Transaction.findByIdAndDelete(req.params.id);
        res.json({ message: "Supprimé !" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Lancer le moteur sur le port 5000
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur en ligne sur http://localhost:${PORT}`);
});
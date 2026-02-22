const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());

// --- CONNEXION MONGODB ATLAS ---
const MONGO_URI = "mongodb+srv://Mohammedtazix:8Db9016f@cluster0.zqd3ws4.mongodb.net/budgetDB?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ RÉUSSI : Connecté au Cloud MongoDB Atlas !"))
    .catch(err => console.error("❌ ERREUR de connexion :", err));

// --- SCHÉMAS DE DONNÉES ---
const Transaction = mongoose.model('Transaction', {
    text: String, 
    amount: Number, 
    category: String, 
    type: String, 
    date: { type: Date, default: Date.now }
});

const Budget = mongoose.model('Budget', { 
    category: String, 
    limit: Number 
});

const Goal = mongoose.model('Goal', { 
    name: String, 
    target: Number, 
    saved: Number 
});

// --- ROUTES API ---

// Transactions
app.get('/api/transactions', async (req, res) => {
    try {
        const tx = await Transaction.find().sort({ date: -1 });
        res.json(tx);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/transactions', async (req, res) => {
    try {
        const newTx = await new Transaction(req.body).save();
        res.json(newTx);
    } catch (err) { res.status(400).json({ error: err.message }); }
});

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

// Lancement
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Serveur en ligne sur le port ${PORT}`));
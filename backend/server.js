const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connexion MongoDB
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ Connexion MongoDB réussie !"))
.catch(err => console.error("❌ Erreur de connexion MongoDB :", err));

/* ==========================================
   MODÈLES DE DONNÉES
========================================== */

// Transactions
const Transaction = mongoose.model('Transaction', new mongoose.Schema({
    text: String,
    amount: Number,
    category: String,
    type: String, // 'income' ou 'expense'
    date: { type: Date, default: Date.now }
}));

// Budgets
const Budget = mongoose.model('Budget', new mongoose.Schema({
    category: String,
    limit: Number,
    spent: { type: Number, default: 0 }
}));

// Objectifs (Goals)
const Goal = mongoose.model('Goal', new mongoose.Schema({
    name: String,
    target: Number,
    current: { type: Number, default: 0 },
    deadline: Date
}));

/* ==========================================
   ROUTES API
========================================== */

// --- TRANSACTIONS ---
app.get('/api/transactions', async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ date: -1 });
        res.json(transactions);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/transactions', async (req, res) => {
    try {
        const newTx = new Transaction(req.body);
        const saved = await newTx.save();
        res.json(saved);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/transactions/:id', async (req, res) => {
    try {
        await Transaction.findByIdAndDelete(req.params.id);
        res.json({ message: "Supprimé" });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- BUDGETS ---
app.get('/api/budgets', async (req, res) => {
    try {
        const budgets = await Budget.find();
        res.json(budgets);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/budgets', async (req, res) => {
    try {
        const newBudget = new Budget(req.body);
        const saved = await newBudget.save();
        res.json(saved);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- GOALS ---
app.get('/api/goals', async (req, res) => {
    try {
        const goals = await Goal.find();
        res.json(goals);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/goals', async (req, res) => {
    try {
        const newGoal = new Goal(req.body);
        const saved = await newGoal.save();
        res.json(saved);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Export pour Vercel
module.exports = app;
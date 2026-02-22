const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connecté"))
  .catch(err => console.error("❌ Erreur MongoDB :", err));

/* --- MODÈLES --- */
const Transaction = mongoose.model('Transaction', new mongoose.Schema({
    text: String, amount: Number, category: String, type: String, date: { type: Date, default: Date.now }
}));

const Budget = mongoose.model('Budget', new mongoose.Schema({
    category: String, limit: Number
}));

const Goal = mongoose.model('Goal', new mongoose.Schema({
    name: String, target: Number, saved: { type: Number, default: 0 }
}));

/* --- ROUTES --- */
// Transactions
app.get('/api/transactions', async (req, res) => res.json(await Transaction.find().sort({ date: -1 })));
app.post('/api/transactions', async (req, res) => res.json(await new Transaction(req.body).save()));
app.delete('/api/transactions/:id', async (req, res) => {
    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: "Supprimé" });
});

// Budgets
app.get('/api/budgets', async (req, res) => res.json(await Budget.find()));
app.post('/api/budgets', async (req, res) => res.json(await new Budget(req.body).save()));

// Objectifs (Goals)
app.get('/api/goals', async (req, res) => res.json(await Goal.find()));
app.post('/api/goals', async (req, res) => res.json(await new Goal(req.body).save()));

module.exports = app;
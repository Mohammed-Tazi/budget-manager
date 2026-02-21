const API_URL = "http://localhost:5000/api";

export const store = {
    transactions: [],
    budgets: [],
    goals: [],

    // 1. CHARGEMENT DES DONNÉES (Depuis MongoDB)
    async fetchTransactions() {
        try {
            const res = await fetch(`${API_URL}/transactions`);
            this.transactions = await res.json();
        } catch (err) {
            console.error("Erreur fetch transactions:", err);
        }
    },

    async fetchBudgets() {
        try {
            const res = await fetch(`${API_URL}/budgets`);
            this.budgets = await res.json();
        } catch (err) {
            console.error("Erreur fetch budgets:", err);
        }
    },

    async fetchGoals() {
        try {
            const res = await fetch(`${API_URL}/goals`);
            this.goals = await res.json();
        } catch (err) {
            console.error("Erreur fetch goals:", err);
        }
    },

    // 2. SAUVEGARDE (Envoi au serveur)
    async saveTransaction(t) {
        const res = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(t)
        });
        return await res.json();
    },

    async deleteTransaction(id) {
        await fetch(`${API_URL}/transactions/${id}`, {
            method: 'DELETE'
        });
    },

    async saveBudget(b) {
        const res = await fetch(`${API_URL}/budgets`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(b)
        });
        return await res.json();
    },

    async saveGoal(g) {
        const res = await fetch(`${API_URL}/goals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(g)
        });
        return await res.json();
    }
};
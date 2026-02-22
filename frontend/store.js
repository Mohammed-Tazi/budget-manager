const API_URL = "/api"; // Changement crucial pour que Vercel trouve le backend

export const store = {
    transactions: [],
    budgets: [],
    goals: [],

    // 1. CHARGEMENT DES DONNÉES (Depuis MongoDB via le serveur)
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

    // 2. SAUVEGARDE ET ACTIONS (Envoi au serveur Vercel)
    async saveTransaction(t) {
        try {
            const res = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(t)
            });
            return await res.json();
        } catch (err) {
            console.error("Erreur lors de l'ajout de la transaction:", err);
        }
    },

    async deleteTransaction(id) {
        try {
            await fetch(`${API_URL}/transactions/${id}`, {
                method: 'DELETE'
            });
        } catch (err) {
            console.error("Erreur lors de la suppression:", err);
        }
    },

    async saveBudget(b) {
        try {
            const res = await fetch(`${API_URL}/budgets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(b)
            });
            return await res.json();
        } catch (err) {
            console.error("Erreur lors de la sauvegarde du budget:", err);
        }
    },

    async saveGoal(g) {
        try {
            const res = await fetch(`${API_URL}/goals`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(g)
            });
            return await res.json();
        } catch (err) {
            console.error("Erreur lors de la sauvegarde de l'objectif:", err);
        }
    }
};
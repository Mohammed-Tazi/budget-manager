export const store = {
    transactions: [],
    budgets: [],
    goals: [],

    // --- RÉCUPÉRATION DES DONNÉES ---
    async fetchTransactions() {
        const res = await fetch("/api/transactions");
        this.transactions = await res.json();
    },

    async fetchBudgets() {
        const res = await fetch("/api/budgets");
        this.budgets = await res.json();
    },

    async fetchGoals() {
        const res = await fetch("/api/goals");
        this.goals = await res.json();
    },

    // --- SAUVEGARDE DES DONNÉES ---
    async saveTransaction(tx) {
        await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tx)
        });
    },

    async saveBudget(budget) {
        await fetch("/api/budgets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(budget)
        });
    },

    async saveGoal(goal) {
        await fetch("/api/goals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(goal)
        });
    },

    // --- SUPPRESSION (Correction : Routes spécifiques ajoutées) ---
    
    // Supprime une transaction
    async deleteTransaction(id) {
        await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    },

    // NOUVEAU : Supprime un budget
    async deleteBudget(id) {
        await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    },

    // NOUVEAU : Supprime un objectif financier
    async deleteGoal(id) {
        const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Échec de la suppression de l'objectif");
    }
};
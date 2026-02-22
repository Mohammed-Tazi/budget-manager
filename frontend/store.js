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

    // Méthode ajoutée pour fixer les limites budgétaires
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

    // --- SUPPRESSION ---
    async deleteTransaction(id) {
        await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    }
};
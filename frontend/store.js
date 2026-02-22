export const store = {
    transactions: [],
    budgets: [],
    goals: [],

    // --- RÉCUPÉRATION ---
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

    // --- SAUVEGARDE ---
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

    // --- SUPPRESSION INDIVIDUELLE ---
    async deleteTransaction(id) {
        await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    },

    async deleteBudget(id) {
        await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    },

    async deleteGoal(id) {
        const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Échec de la suppression de l'objectif");
    },

    // --- RÉINITIALISATION TOTALE ---
    async resetAllData() {
        const res = await fetch("/api/reset", { method: "DELETE" });
        if (!res.ok) throw new Error("Erreur lors de la réinitialisation");
        this.transactions = [];
        this.budgets = [];
        this.goals = [];
    }
};
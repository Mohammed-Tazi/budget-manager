export const store = {
    transactions: [],
    budgets: [],
    goals: [],

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

    // --- CORRECTION SUPPRESSION ---
    async deleteBudget(id) {
        const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Erreur serveur");
    },
    async deleteGoal(id) {
        const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Erreur serveur");
    },
    async deleteTransaction(id) {
        await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    },

    // --- RÉINITIALISATION TOTALE ---
    async resetAllData() {
        const res = await fetch("/api/reset", { method: "DELETE" });
        if (!res.ok) throw new Error("Échec du reset");
        this.transactions = [];
        this.budgets = [];
        this.goals = [];
    }
};
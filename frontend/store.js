export const store = {
    transactions: [],
    budgets: [],
    goals: [],

    async fetchTransactions() {
        const res = await fetch("/api/transactions");
        this.transactions = await res.json();
    },

    async fetchGoals() {
        const res = await fetch("/api/goals");
        this.goals = await res.json();
    },

    async saveGoal(goal) {
        await fetch("/api/goals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(goal)
        });
    },

    // Cette fonction est cruciale pour corriger ton erreur de suppression
    async deleteGoal(id) {
        const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Erreur serveur lors de la suppression");
    },

    // Pour faire fonctionner ton bouton rouge de réinitialisation
    async resetAllData() {
        const res = await fetch("/api/reset", { method: "DELETE" });
        if (!res.ok) throw new Error("Échec du reset complet");
        this.transactions = [];
        this.goals = [];
    }
};
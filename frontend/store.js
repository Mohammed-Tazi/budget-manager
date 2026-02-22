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

    async saveTransaction(tx) {
        await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tx)
        });
    },

    async saveGoal(goal) {
        await fetch("/api/goals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(goal)
        });
    },

    async deleteTransaction(id) {
        await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    }
};
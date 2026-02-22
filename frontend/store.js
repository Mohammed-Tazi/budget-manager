const API_URL = "/api";

export const store = {
    transactions: [],
    budgets: [],
    goals: [],

    async fetchTransactions() {
        try {
            const res = await fetch(`${API_URL}/transactions`);
            this.transactions = await res.json();
        } catch (err) { console.error("Erreur:", err); }
    },

    async saveTransaction(t) {
        const res = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(t)
        });
        return await res.json();
    },

    async fetchBudgets() {
        const res = await fetch(`${API_URL}/budgets`);
        this.budgets = await res.json();
    },

    async fetchGoals() {
        const res = await fetch(`${API_URL}/goals`);
        this.goals = await res.json();
    }
};
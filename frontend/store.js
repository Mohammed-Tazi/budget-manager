export const store = {
    transactions: [],
    budgets: [],

    // Récupérer toutes les transactions
    async fetchTransactions() {
        try {
            const res = await fetch("/api/transactions");
            if (!res.ok) throw new Error("Échec fetch transactions");
            this.transactions = await res.json();
        } catch (err) {
            console.error("Erreur Store (Transactions):", err);
            this.transactions = [];
        }
    },

    // Récupérer les budgets
    async fetchBudgets() {
        try {
            const res = await fetch("/api/budgets");
            if (!res.ok) throw new Error("Échec fetch budgets");
            this.budgets = await res.json();
        } catch (err) {
            console.error("Erreur Store (Budgets):", err);
            this.budgets = [];
        }
    },

    // Sauvegarder une transaction
    async saveTransaction(tx) {
        const res = await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tx)
        });
        return await res.json();
    },

    // Supprimer une transaction
    async deleteTransaction(id) {
        await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    }
};
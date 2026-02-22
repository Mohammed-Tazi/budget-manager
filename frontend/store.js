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

    // --- SAUVEGARDE DES DONNÉES (Mise à jour locale ajoutée) ---
    async saveTransaction(tx) {
        const res = await fetch("/api/transactions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tx)
        });
        if (res.ok) await this.fetchTransactions(); // Rafraîchir la liste locale
    },

    async saveBudget(budget) {
        const res = await fetch("/api/budgets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(budget)
        });
        if (res.ok) await this.fetchBudgets();
    },

    async saveGoal(goal) {
        const res = await fetch("/api/goals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(goal)
        });
        if (res.ok) await this.fetchGoals();
    },

    // --- SUPPRESSION (Correction IDs & Filtrage local) ---
    
    async deleteTransaction(id) {
        const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
        if (res.ok) {
            // Filtrer localement pour une réactivité immédiate
            this.transactions = this.transactions.filter(t => (t._id || t.id) !== id);
        }
    },

    async deleteBudget(id) {
        const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
        if (res.ok) {
            this.budgets = this.budgets.filter(b => (b._id || b.id) !== id);
        }
    },

    async deleteGoal(id) {
        const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Échec de la suppression de l'objectif");
        
        // Mise à jour locale après succès
        this.goals = this.goals.filter(g => (g._id || g.id) !== id);
    },

    // --- RÉINITIALISATION (Correction Reset) ---
    async resetAllData() {
        try {
            const res = await fetch("/api/reset", { method: "DELETE" });
            if (!res.ok) throw new Error("Erreur serveur lors de la réinitialisation");
            
            // On vide tout localement
            this.transactions = [];
            this.budgets = [];
            this.goals = [];
        } catch (err) {
            console.error("Échec du reset:", err);
            throw err;
        }
    }
};
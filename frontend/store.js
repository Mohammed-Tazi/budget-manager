export const store = {
    // ... reste du code ...

    // --- CORRECTION SUPPRESSION ---
    async deleteBudget(id) {
        // Vérifiez bien que votre API accepte l'ID en fin d'URL
        const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Erreur serveur lors de la suppression");
    },

    async deleteGoal(id) {
        const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("Erreur serveur lors de la suppression");
    },

    // --- RESET TOTAL (Pour nettoyer vos tests actuels) ---
    async resetAllData() {
        const res = await fetch("/api/reset", { method: "DELETE" });
        if (!res.ok) throw new Error("Échec de la réinitialisation");
        this.transactions = [];
        this.budgets = [];
        this.goals = [];
    }
};
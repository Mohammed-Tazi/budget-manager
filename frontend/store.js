// store.js
export const store = {
    // Récupération des données avec conversion immédiate en types propres
    transactions: JSON.parse(localStorage.getItem("transactions") || "[]").map(t => ({
        ...t,
        amount: Number(t.amount) || 0 // Sécurité : force le montant en nombre
    })),
    
    budgets: JSON.parse(localStorage.getItem("budgets") || "{}"),
    
    goals: JSON.parse(localStorage.getItem("goals") || "[]").map(g => ({
        ...g,
        target: Number(g.target) || 0,
        saved: Number(g.saved) || 0
    })),

    // Méthode de sauvegarde centralisée
    save() {
        localStorage.setItem("transactions", JSON.stringify(this.transactions));
        localStorage.setItem("budgets", JSON.stringify(this.budgets));
        localStorage.setItem("goals", JSON.stringify(this.goals));
    }
};
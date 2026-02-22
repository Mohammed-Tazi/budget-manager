export const store = {
    transactions: [],
    // On utilise "/api" car vercel.json s'occupe de faire le lien
    API_URL: "/api/transactions",

    async fetchTransactions() {
        try {
            const res = await fetch(this.API_URL);
            if (!res.ok) throw new Error("Erreur serveur");
            this.transactions = await res.json();
        } catch (err) {
            console.error("Erreur lors de la récupération :", err);
        }
    },

    async saveTransaction(tx) {
        const res = await fetch(this.API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(tx)
        });
        if (!res.ok) throw new Error("Impossible d'enregistrer");
        return await res.json();
    },

    async deleteTransaction(id) {
        await fetch(`${this.API_URL}/${id}`, { method: "DELETE" });
    }
};
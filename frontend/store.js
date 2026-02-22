export const store = {
    transactions: [],
    // Utilisation d'un chemin relatif pour Vercel
    API_URL: "/api/transactions",

    async fetchTransactions() {
        try {
            const res = await fetch(this.API_URL);
            if (!res.ok) throw new Error("Erreur serveur");
            this.transactions = await res.json();
        } catch (err) {
            console.error("Erreur fetch:", err);
            throw err;
        }
    },

    async saveTransaction(tx) {
        try {
            const res = await fetch(this.API_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(tx)
            });
            return await res.json();
        } catch (err) {
            console.error("Erreur save:", err);
            throw err;
        }
    },

    async deleteTransaction(id) {
        try {
            await fetch(`${this.API_URL}/${id}`, { method: "DELETE" });
        } catch (err) {
            console.error("Erreur delete:", err);
            throw err;
        }
    }
};
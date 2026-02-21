export const store = {
 transactions: JSON.parse(localStorage.transactions||"[]"),
 budgets: JSON.parse(localStorage.budgets||"{}"),
 goals: JSON.parse(localStorage.goals||"[]"),

 save(){
  localStorage.transactions = JSON.stringify(this.transactions)
  localStorage.budgets = JSON.stringify(this.budgets)
  localStorage.goals = JSON.stringify(this.goals)
 }
}
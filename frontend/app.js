import {store} from "./store.js"

window.addTransaction = (t)=>{
 store.transactions.push(t)
 store.save()
 render()
}

window.deleteTransaction = (i)=>{
 store.transactions.splice(i,1)
 store.save()
 render()
}

window.addGoal = g =>{
 store.goals.push(g)
 store.save()
 render()
}

window.setBudget = (cat,val)=>{
 store.budgets[cat]=val
 store.save()
 render()
}

function totals(){
 let income=0,expense=0
 store.transactions.forEach(t=>{
  t.type==="income" ? income+=t.amount : expense+=t.amount
 })
 return {income,expense,total:income-expense}
}

window.render = ()=>{
 const t=totals()

 document.querySelectorAll("[data-total]").forEach(e=>e.innerText=t.total+" MAD")
 document.querySelectorAll("[data-income]").forEach(e=>e.innerText=t.income)
 document.querySelectorAll("[data-expense]").forEach(e=>e.innerText=t.expense)

 renderTransactions()
 renderBudgets()
 renderGoals()
}

function renderTransactions(){
 const el=document.getElementById("txList")
 if(!el) return
 el.innerHTML=""
 store.transactions.forEach((t,i)=>{
  el.innerHTML+=`
   <div class="card">
    ${t.title} - ${t.amount} MAD (${t.category})
    <button class="danger" onclick="deleteTransaction(${i})">X</button>
   </div>
  `
 })
}

function renderBudgets(){
 const el=document.getElementById("budgetList")
 if(!el) return
 el.innerHTML=""
 Object.entries(store.budgets).forEach(([c,v])=>{
  let spent=store.transactions
   .filter(t=>t.category===c && t.type==="expense")
   .reduce((a,b)=>a+b.amount,0)

  let p=Math.min(100,(spent/v)*100)

  el.innerHTML+=`
  <div class="card">
   ${c} : ${spent}/${v}
   <div class="progress"><span style="width:${p}%"></span></div>
  </div>`
 })
}

function renderGoals(){
 const el=document.getElementById("goalList")
 if(!el) return
 el.innerHTML=""
 store.goals.forEach(g=>{
  let p=(g.saved/g.target)*100
  el.innerHTML+=`
   <div class="card">
    ${g.name} ${g.saved}/${g.target}
    <div class="progress"><span style="width:${p}%"></span></div>
   </div>`
 })
}

render()
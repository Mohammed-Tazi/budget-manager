const tx = JSON.parse(localStorage.transactions || "[]")
const budgets = JSON.parse(localStorage.budgets || "{}")
const goals = JSON.parse(localStorage.goals || "[]")

/* ================= KPI ================= */
let income=0, expense=0
tx.forEach(t=> t.type==="income"?income+=t.amount:expense+=t.amount)
const total = income-expense

kpiTotal.innerText = total+" MAD"
kpiIncome.innerText = income
kpiExpense.innerText = expense

/* ================= SCORE ================= */
let score = 100
if(expense>income) score-=40
if(goals.length===0) score-=10
if(Object.keys(budgets).length===0) score-=10
financeScore.innerText = score+"/100"

/* ================= CHARTS ================= */
new Chart(flowChart,{
 type:"bar",
 data:{labels:["Income","Expense"],datasets:[{data:[income,expense]}]}
})

const catMap={}
tx.forEach(t=>{
 if(t.type==="expense")
  catMap[t.category]=(catMap[t.category]||0)+t.amount
})

new Chart(categoryChart,{
 type:"doughnut",
 data:{labels:Object.keys(catMap),datasets:[{data:Object.values(catMap)}]}
})

/* ================= LIVE TX ================= */
function renderTx(list){
 txLive.innerHTML=""
 list.forEach(t=>{
  txLive.innerHTML+=`<div>${t.title} — ${t.amount} MAD</div>`
 })
}
renderTx(tx)

/* ================= SEARCH & FILTER ================= */
search.oninput=applyFilters
filterType.onchange=applyFilters

function applyFilters(){
 let list=[...tx]
 if(filterType.value!=="all")
  list=list.filter(t=>t.type===filterType.value)

 list=list.filter(t=>t.title.toLowerCase().includes(search.value.toLowerCase()))
 renderTx(list)
}

function resetFilters(){
 search.value=""
 filterType.value="all"
 renderTx(tx)
}

/* ================= BUDGETS ================= */
Object.entries(budgets).forEach(([c,v])=>{
 let spent = tx.filter(t=>t.category===c && t.type==="expense")
              .reduce((a,b)=>a+b.amount,0)
 let p=Math.min(100,(spent/v)*100)
 budgetStatus.innerHTML+=`
  <div>${c} ${spent}/${v} MAD
   <div class="progress"><span style="width:${p}%"></span></div>
  </div>`
 if(spent>v){
  alerts.innerHTML+=`<div>⚠ Dépassement ${c}</div>`
 }
})

/* ================= GOALS ================= */
goals.forEach(g=>{
 let p=(g.saved/g.target)*100
 goalStatus.innerHTML+=`
  <div>${g.name} ${g.saved}/${g.target}
   <div class="progress"><span style="width:${p}%"></span></div>
  </div>`
})

/* ================= FORECAST ================= */
const days = new Date().getDate()
const avg = expense/days
const forecast = Math.round(avg*30)
forecast.innerText = `Prévision dépenses: ${forecast} MAD`

/* ================= TIMELINE ================= */
tx.slice(-10).reverse().forEach(t=>{
 timeline.innerHTML+=`<div>${t.title} → ${t.amount} MAD</div>`
})
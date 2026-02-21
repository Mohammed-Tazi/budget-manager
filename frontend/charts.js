import {store} from "./store.js"

const ctx1=document.getElementById("pie")
const ctx2=document.getElementById("bar")

let income=0,expense=0
store.transactions.forEach(t=>{
 t.type==="income"?income+=t.amount:expense+=t.amount
})

new Chart(ctx1,{
 type:"doughnut",
 data:{
  labels:["Income","Expense"],
  datasets:[{data:[income,expense]}]
 }
})

const cats={}
store.transactions.forEach(t=>{
 if(t.type==="expense")
 cats[t.category]=(cats[t.category]||0)+t.amount
})

new Chart(ctx2,{
 type:"bar",
 data:{
  labels:Object.keys(cats),
  datasets:[{data:Object.values(cats)}]
 }
})
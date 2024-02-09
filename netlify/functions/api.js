import "dotenv/config"
import express, { Router } from "express"
import cors from "cors"
import bodyParser from "body-parser"
import mongoose from "mongoose"
import serverless from 'serverless-http'

const api = express()

api.use(cors())
api.use(bodyParser.json())


mongoose.connect(process.env.DATABASE_URL)

const budgetSchema = new mongoose.Schema({
    name: String,
    max: Number,
})

const expenseSchema = new mongoose.Schema({
    description: String,
    amount: Number,
    budgetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Budget"
    }
})

const Budget = mongoose.model("Budget", budgetSchema)
const Expense = mongoose.model("Expense", expenseSchema)

const router = Router()

router.get('/', (req, res) => {
    res.json({
        message: "Budget backend running"
    })
})

router.get('/budgets', async (req, res) => {
    try{
    const allBudgets = await Budget.find({})
    res.json(allBudgets)
    } catch (e) {
        console.error(e)
    }
})

//should be using await but we dont need it for now
router.post('/budgets/new', (req, res) => {
    const budget = req.body
    const newBudget = new Budget({ name: budget.name, max: budget.max})
    newBudget
    .save()
    .then(()=> {
        console.log("Budget saved");
        res.sendStatus(200)
    })
    .catch((e) => console.error(e))
})


router.delete("/budgets/:id", async (req, res) => {
    const budgetId = req.params.id
    const uncategorised = await Budget.findOne({name: "Diger"})
    let uncategorisedId = uncategorised._id 
    if (!uncategorised) {
        const createUncategorised = new Budget({name: "Diger", max: 0})
        await createUncategorised.save()
        uncategorisedId = createUncategorised._id
    }
    await Expense.updateMany({"budgetId": budgetId}, {"budgetId": uncategorisedId})
    await Budget.findByIdAndDelete(budgetId)
    console.log("Budget deleted")
    res.sendStatus(200)
})

router.put("/budgets/:id", async (req, res) => {
    const budget = req.body
    try {
    const updatedBudget = await Budget.updateOne({"_id": req.params.id}, { name: budget.name, max: budget.max })
        console.log("Budget Updated");
        res.sendStatus(200)
    } catch (e) {
        console.error(e)
    }
    })

router.get('/expenses', async (req, res) => {
    try{
    const allExpenses = await Expense.find({}).populate('budgetId')
    res.json(allExpenses)
    } catch (e) {
        console.error(e)
    }
})

router.post("/expenses/new", async (req, res) => {
    const expense = req.body
    if (expense.budgetId !== 'Diger') {
        const newExpense = new Expense({
            description: expense.description,
            amount: expense.amount,
            budgetId: expense.budgetId,
        })
        await newExpense.save()
        console.log('Expense Saved')
        res.sendStatus(200)
    } else {
        const uncategorised = await Budget.findOne({name: 'Diger'})
        if(!uncategorised) {
            const createUncategorised = new Budget({name: 'Diger', max: 0})
            await createUncategorised.save()
            const newExpense = newExpense({
                description: expense.description,
                amount: expense.amount,
                budgetId: createUncategorised._id
            })
            await newExpense.save()
            console.log('Expense Saved')
            res.sendStatus(200)     
        } else {
            const newExpense = new Expense({
                description: expense.description,
                amount: expense.amount,
                budgetId: uncategorised._id,
            })
            await newExpense.save()
            console.log('Expense Saved')
            res.sendStatus(200)

        }
    }
})


router.put('/expenses/:id', async (req, res) => {
   try {
    const expense = req.body
    const updatedExpense = await Expense.updateOne({"_id": req.params.id}, { description: expense.description, amount: expense.amount, budgetId: expense.budgetId })
    console.log("Expense Updated")
    res.sendStatus(200)
   } catch(err) {
    console.error(err)
    res.sendStatus(500)
   }
})

router.delete('/expenses/:id', async (req, res) => {
    const expenseId = req.params.id
    await Expense.findByIdAndDelete(expenseId)
    console.log("Expense Deleted")
    res.sendStatus(200)
})

api.use("/api/", router)

export const handler = serverless(api)
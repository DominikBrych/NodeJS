import express from 'express'
import db, { getAllTodos } from './src/db.js'
import { createWebSocketServer, sendTodosToAllConnections } from './src/websockets.js'

const port = 3000

const app = express()

app.set('view engine', 'ejs')

app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))

app.get('/', async (req, res) => {
  const query = db('todos').select('*')

  if (req.query.done) {
    query.where('done', req.query.done === 'true')
  }

  if (req.query.search) {
    query.whereLike('text', `%${req.query.search}%`)
  }

  const todos = await query

  res.render('index', {
    title: 'ToDos!',
    todos,
  })
})

app.post('/add', async (req, res) => {
  const text = String(req.body.text)

  await db('todos').insert({
    text,
  })

  res.redirect('/')
})

app.get('/toggle/:id', async (req, res, next) => {
  const id = Number(req.params.id)

  const todo = await db('todos').select('*').where('id', id).first()

  if (!todo) return next()

  await db('todos').update({ done: !todo.done }).where('id', id)

  sendTodosToAllConnections()

  res.redirect('back')
})

app.get('/delete/:id', async (req, res, next) => {
  const id = Number(req.params.id)

  const todo = await db('todos').select('*').where('id', id).first()

  if (!todo) return next()

  await db('todos').delete().where('id', id)

  sendTodosToAllConnections()

  res.redirect('/')
})

app.get('/detail/:id', async (req, res, next) => {
  const id = Number(req.params.id)

  const todo = await db('todos').select('*').where('id', id).first()

  if (!todo) return next()

  res.render('detail', {
    todo,
  })
})

app.post('/edit/:id', async (req, res, next) => {
  const id = Number(req.params.id)
  const text = String(req.body.text)

  const todo = await db('todos').select('*').where('id', id).first()

  if (!todo) return next()

  await db('todos').update({ text }).where('id', id)

  sendTodosToAllConnections()

  res.redirect('back')
})

app.use((req, res) => {
  console.log('404', req.method, req.url)

  res.render('404')
})

const server = app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`)
})

createWebSocketServer(server)

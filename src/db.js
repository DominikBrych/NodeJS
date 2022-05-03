import knex from 'knex'
import knexfile from '../knexfile.js'

const db = knex(knexfile)

export default db

export const getAllTodos = async () => {
  const todos = await db('todos').select('*')

  return todos
}

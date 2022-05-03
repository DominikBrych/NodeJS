import ejs from 'ejs'
import { WebSocketServer, WebSocket } from 'ws'
import db from './db.js'

/** @type {Set<WebSocket>} */
const connections = new Set()

export const createWebSocketServer = (server) => {
  const wss = new WebSocketServer({ server })

  wss.on('connection', (ws, req) => {
    ws.id = req.url.split('id=')[1]
    connections.add(ws)

    console.log('New connection', connections.size)

    ws.on('close', () => {
      connections.delete(ws)

      console.log('Closed connection', connections.size)
    })
  })
}

export const sendTodosToAllConnections = async (id) => {
  for (const connection of connections) {
    let html;
    //sending update to clients on related detail page
    if(connection.id && connection.id == id) {
      const todo = await db('todos').select('*').where('id', id).first();
      if(todo) {
        html = await ejs.renderFile('views/detail.ejs', {
          todo,
        });
      }

    }
    //send update to clients on main page
    else if(!connection.id) {
      const todos = await db('todos').select('*')
      html = await ejs.renderFile('views/_todos.ejs', {
        todos,
      });
    }
    else {
      return;
    }
    const message = {
      type: !connection.id ? 'todos' : 'todo',
      html,
    }

    const json = JSON.stringify(message)

    connection.send(json)
  }
}

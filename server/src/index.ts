import { WebSocketServer, WebSocket } from 'ws';
import { WSMessage } from './types';
import { getRegResponseData } from './scripts/reg';
import { games } from './data/games.data';
import { setNewGame } from './scripts/createGame';
import { joinGame } from './scripts/joinGame';

/* TODO
0. [ ] Don't let a user login again if he s online
1. [x] Change user selection from array.find() to Map
2. [ ] Add disconection processing
3. [ ] Process game deletion
*. [ ] Trycatch instead of ifs?
*. [ ] Rename users to registeredUsers in users.data
*. [ ] !!! Learn to add semicolons !!!
*/

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const wss = new WebSocketServer({ port: PORT });
const activeConncections = new Map<WebSocket, string>()

wss.on('connection', ws => {
  ws.on('message', message => {
    const messageData = JSON.parse(message.toString())
    const {type, data} = messageData
    
    var response: WSMessage

    switch(type){
      //registration and game creation cases
      case 'reg':
        response = { type, 'data': getRegResponseData(data), 'id': 0 }
        if (!response.data.error){
          activeConncections.set(ws, response.data.index)
        }
        break

      case 'create_game':
        var responseType = 'game_created'
        const hostId = activeConncections.get(ws)

        if (!hostId){
          return
        }

        response = { 'type': responseType, 'data': setNewGame(data, hostId), 'id': 0 }
        break

      //joining the game cases
      case 'join_game':
        var responseType = 'game_joined'
        const gameId = joinGame(data, activeConncections.get(ws))
        
        if (!gameId){
          return
        }

        response = { 'type': responseType, 'data': gameId, 'id': 0 }
        break

      default:
        console.log('unknown request type')
        return
    }

    if (response){
      ws.send(JSON.stringify(response))
    }
  })
})
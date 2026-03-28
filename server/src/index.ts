import { WebSocketServer, WebSocket } from 'ws';
import { WSMessage } from './types';
import { getRegResponseData } from './scripts/reg';
import { games } from './data/games.data';
import { setNewGame } from './scripts/createGame';
import { handleGameJoin } from './scripts/joinGame';
import { users } from './data/users.data';

/* TODO
0. [x] Don't let a host join his own game
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

    const postponedResponses: WSMessage[] = []

    switch(type){
      //registration and game creation cases
      case 'reg':
        response = { type, 'data': getRegResponseData(data, ws), 'id': 0 }
        if (!response.data.error){
          activeConncections.set(ws, response.data.name)
        }
        ws.send(JSON.stringify(response))
        break

      case 'create_game':
        var responseType = 'game_created'
        const hostName = activeConncections.get(ws)

        if (!hostName){
          return
        }

        response = { 'type': responseType, 'data': setNewGame(data, hostName), 'id': 0 }
        ws.send(JSON.stringify(response))
        break

      //joining the game case
      case 'join_game':
        const joinData = handleGameJoin(data, activeConncections.get(ws), ws)
        
        if (!joinData){
          return
        }

        const hostSocket = joinData.host?.ws
        const gameId = joinData.gameId
        const playerCount = joinData.playerCount
        const gamePlayersData = joinData.players
        const newPlayerName = joinData.userName
        
        if (!gameId){
          return
        }

        //response to just connected player
        var joiningResponse = { 'type': 'game_joined', 'data': { gameId } , 'id': 0 }
        //broadcasting player data for everyone
        var joiningBroadcast = { 'type': 'player_joined', 'data': { 'name': newPlayerName, playerCount }, 'id': 0}
        //broadcasting players list update data
        var playersUpdateBroadcast = { 'type': 'update_players', 'data': gamePlayersData, 'id': 0 } //need to send all the players in game

        ws.send(JSON.stringify(joiningResponse))
      
        for (const player of gamePlayersData){
          const playerSocket = player.ws

          playerSocket?.send(JSON.stringify(joiningBroadcast))
          playerSocket?.send(JSON.stringify(playersUpdateBroadcast))
        }

        hostSocket?.send(JSON.stringify(joiningBroadcast))
        hostSocket?.send(JSON.stringify(playersUpdateBroadcast))
        break

      default:
        console.log('unknown request type')
        return
    }
  })
})
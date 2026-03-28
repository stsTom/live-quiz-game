import { WebSocketServer, WebSocket } from 'ws';
import { WSMessage } from './types';
import { getRegResponseData } from './scripts/reg';
import { games, gamesById } from './data/games.data';
import { setNewGame } from './scripts/createGame';
import { handleGameJoin } from './scripts/joinGame';
import { users } from './data/users.data';
import { startGame } from './scripts/startGame';
import { handleAnswer } from './scripts/handleAnswer';

/* TODO
0. [x] Don't let a host join his own game
1. [x] Change user selection from array.find() to Map
2. [ ] Add disconection processing
3. [ ] Process game deletion
4. [ ] Refactor scripts (get rid of as many ifs as possible and shorten some scripts, do smth with global scope variables!)
5. [ ] Refactor: add seperate logic for list of players update
6. [ ] Add another Map for users to search them by Id
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
    const postponedResponses: WSMessage[] = []
    
    var response: WSMessage

    switch(type){
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

        // console.log(hostSocket)
        hostSocket?.send(JSON.stringify(joiningBroadcast))
        hostSocket?.send(JSON.stringify(playersUpdateBroadcast))
        break
      case 'start_game':
        var responseType = 'question'

        const responseData = startGame(data.gameId)
        const players = gamesById.get(data.gameId)?.players
        
        response = { 'type': responseType, 'data': responseData, 'id': 0 }
        
        if (!players){
          return
        }

        for (const player of players!){
          const playerSocket = player.ws

          playerSocket?.send(JSON.stringify(response))
        }

        var gameHost = users.get(gamesById.get(data.gameId)?.hostId!)?.ws

        gameHost?.send(JSON.stringify(response))
        break
      case 'answer':
        handleAnswer(data, activeConncections.get(ws))

        response = { 'type': 'answer_accepted', 'data': { 'questionIndex': data.questionIndex }, 'id': 0 }
        ws.send(JSON.stringify(response))
      default:
        console.log('unknown request type')
        return
    }
  })
})
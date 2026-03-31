import { WebSocketServer, WebSocket } from 'ws';
import { WSMessage } from './types';
import { getRegResponseData } from './scripts/reg';
import { games, gamesById } from './data/games.data';
import { setNewGame } from './scripts/createGame';
import { handleGameJoin } from './scripts/joinGame';
import { users } from './data/users.data';
import { handleNextQuestion } from './scripts/handleNextQuestion';
import { acceptAnswer } from './scripts/acceptAnswer';
import { getQuestionResults } from './scripts/getQuestionResults';

/* TODO
0. [x] Don't let a host join his own game
1. [x] Change user selection from array.find() to Map
2. [x] Add disconection processing
3. [ ] Process game deletion
4. [ ] Refactor scripts (move repeating pieces into separate scripts (such as handling timer, sending broadcasts, etc))
5. [ ] Refactor: add seperate logic for list of players update
6. [ ] Add another Map for users to search them by Id
7. [ ] Ids cannot be assigned by the amount of users! (generate ids the same way as codes?)
*. [ ] Trycatch instead of ifs?
*. [ ] Rename users to registeredUsers in users.data
*. [ ] !!! Learn to add semicolons !!!
*/

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const wss = new WebSocketServer({ port: PORT });
const activeConncections = new Map<WebSocket, string>()

let quizTimer: ReturnType<typeof setTimeout> | null = null;
let timerStartTime: number | null = null;

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

        var hostSocket = joinData.host?.ws
        var gameId = joinData.gameId
        var playerCount = joinData.playerCount
        var gamePlayersData = joinData.players
        var newPlayerName = joinData.userName
        
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
      
        for (const player of gamesById.get(gameId)?.players!){
          const playerSocket = player.ws

          playerSocket?.send(JSON.stringify(joiningBroadcast))
          playerSocket?.send(JSON.stringify(playersUpdateBroadcast))
        }

        hostSocket?.send(JSON.stringify(joiningBroadcast))
        hostSocket?.send(JSON.stringify(playersUpdateBroadcast))
        break
      case 'start_game':
        var responseMessage = handleNextQuestion(data.gameId)
        
        if (!responseMessage){
          return
        }

        response = responseMessage
        for (const player of gamesById.get(data.gameId)?.players!){
          const playerSocket = users.get(player.name)?.ws

          playerSocket?.send(JSON.stringify(response))
        }
        
        var hostSocket = users.get(gamesById.get(data.gameId)!.hostId)!.ws

        hostSocket?.send(JSON.stringify(response))
        
        timerStartTime = Date.now()
        var timeLimit = response.data.timeLimitSec
        
        quizTimer = setTimeout(() => {
          console.log('timer expired')
          responseType = 'questionResult'
          response = { 'type': responseType, 'data': getQuestionResults(data.gameId), 'id': 0 }
          
          for (const player in gamesById.get(data.gameId)?.players){
            const playerSocket = users.get(player)?.ws

            playerSocket?.send(JSON.stringify(response))
          }
        
          var hostSocket = users.get(gamesById.get(data.gameId)!.hostId)!.ws

          hostSocket?.send(JSON.stringify(response))

          var nextQuestion = handleNextQuestion(data.gameId)

          if (!nextQuestion){
            return
          }

          response = nextQuestion

          for (const player in gamesById.get(data.gameId)?.players){
              const playerSocket = users.get(player)?.ws

              playerSocket?.send(JSON.stringify(response))
            }
          
          var hostSocket = users.get(gamesById.get(data.gameId)!.hostId)!.ws

          hostSocket?.send(JSON.stringify(response))
        }, timeLimit * 1000)

        break
      case 'answer':
        const timePassed = Date.now() - timerStartTime!
        
        responseType = 'answer_accepted'
        response = {
          'type': responseType,
          'data': { 'questionIndex': acceptAnswer(data, timePassed, activeConncections.get(ws)!) },
          'id': 0
        }
        ws.send(JSON.stringify(response))

        if (gamesById.get(data.gameId)?.players.every(player => player.hasAnswered)){
          clearTimeout(quizTimer!) //timer gets back to initial number
          responseType = 'questionResult'
          response = { 'type': responseType, 'data': getQuestionResults(data.gameId), 'id': 0 }
          
          for (const player of gamesById.get(data.gameId)?.players!){
            const playerSocket = users.get(player.name)?.ws

            playerSocket?.send(JSON.stringify(response))
          }
        
          const hostSocket = users.get(gamesById.get(data.gameId)!.hostId)!.ws

          hostSocket?.send(JSON.stringify(response))
        }

        var nextQuestion = handleNextQuestion(data.gameId)

        if (!nextQuestion){
          return
        }

        response = nextQuestion

        for (const player of gamesById.get(data.gameId)?.players!){
            const playerSocket = users.get(player.name)?.ws

            playerSocket?.send(JSON.stringify(response))
          }
        
        var hostSocket = users.get(gamesById.get(data.gameId)!.hostId)!.ws

        hostSocket?.send(JSON.stringify(response))
        break
      default:
        console.log('unknown request type')
        return
    }
  })
  ws.on('close', () => {
    gamesById.forEach(game => {
      game.players = game.players.filter(player => player.name === activeConncections.get(ws))
      const updatedPlayersList = []

      for (const player of game.players){
        const playerData = {
          'name': player.name,
          'index': player.index,
          'score': player.score
        }
        
        updatedPlayersList.push(playerData)
      }
      
      const updateMessage: WSMessage = { 'type': 'update_players', 'data': updatedPlayersList, 'id': 0 }

      for (const player of game.players){
        const playerSocket = player.ws

        playerSocket?.send(JSON.stringify(updateMessage))
      } 

      const hostSocket = users.get(game.hostId)?.ws

      hostSocket?.send(JSON.stringify(updateMessage))
    })
    activeConncections.delete(ws)
  })
})
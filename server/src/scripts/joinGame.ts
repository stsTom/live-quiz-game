import { games } from "../data/games.data"
import { users } from "../data/users.data"
import { Player } from "../types"
import WebSocket from "ws"

export const handleGameJoin = (data: any, userName: string | undefined, ws: WebSocket) => {
  const { code } = data
  const game = games.get(code.toUpperCase())

  if (!userName){
    'How did you come so far? You are not on the list of logged in players'
    return
  }
  if (!game || (userName && users.get(userName)?.index === game.hostId)){
    console.log(`Provided code is incorrect or you are the game's host`)
    return
  }

  const playerData: Player = {
    'name': userName,
    'index': users.get(userName)!.index,
    'score': 0,
    'ws': ws
  }

  if (!game.players.find(player => player === playerData) && game.status === 'waiting'){
    game.players.push(playerData)
    const host = users.get(game.hostId)
    const players = []
  
    for (const player of game.players){
      const {ws, ...data} = player
      players.push(data)
    }
  
    const playerCount = players.length
    const fullData = {host, 'gameId': game.id, players, playerCount, userName}
  
    return fullData
  }
}
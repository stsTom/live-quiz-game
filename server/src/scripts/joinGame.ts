import { games, gamesById } from "../data/games.data"
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
    'index': users.get(userName)!.index, //TODO: check if there are cases when users won't contain username
    'score': 0,
    'ws': ws
  }

  game.players.push(playerData) //if the game is not in process?
  // gamesById.get(game.id)?.players.push(playerData)
  
  const host = users.get(game.hostId)
  const players = game.players //ws shouldn't be sent
  const playerCount = players.length
  const fullData = {host, 'gameId': game.id, players, playerCount, userName}

  return fullData
}
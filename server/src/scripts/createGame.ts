import { games } from "../data/games.data"
import { Game } from "../types"

export const getGameCode = (data: any, hostId: string) => {
  const gameId = games.size.toString()

  let gameCode = ''

  while (gameCode.length < 6){
    gameCode += Math.random().toString(36)
  }

  gameCode = gameCode.substring(2, 8)

  const newGame: Game = {
    'id': gameId,
    'code': gameCode,
    hostId,
    'players': [],
    'currentQuestion': 0,
    'status': 'waiting',
    'playerAnswers': new Map(),
    ...data
  }

  games.set(gameId, newGame)

  return { gameId, 'code': gameCode }
}
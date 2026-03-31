import { games, gamesById } from "../data/games.data"
import { Game } from "../types"

const createGameCode = () => {
  let gameCode = ''

  while (gameCode.length < 6){
    gameCode += Math.random().toString(36).toUpperCase()
  }

  gameCode = gameCode.substring(2, 8)

  if (games.get(gameCode)){
    createGameCode()
  }

  return gameCode
}

export const setNewGame = (data: any, hostName: string) => {
  const gameId = games.size.toString()
  const code = createGameCode()

  const newGame: Game = {
    'id': gameId,
    code,
    'hostId': hostName, // I don't know yet how to change the sctructure so I could reference users by id instead of name
    'players': [],
    'currentQuestion': 0,
    'status': 'waiting',
    'playerAnswers': new Map(),
    ...data
  }

  games.set(code, newGame)
  gamesById.set(gameId, newGame)

  return { gameId, 'code': code }
}
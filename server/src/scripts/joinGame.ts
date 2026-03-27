import { games } from "../data/games.data"

export const joinGame = (data: any, playerId: string | undefined) => {
  const { code } = data
  const game = games.get(code.toUpperCase())

  if (!game || (playerId && playerId === game.hostId)){
    console.log(`Provided code is incorrect or you are the game's host`)
    return
  }

  return game.id
}
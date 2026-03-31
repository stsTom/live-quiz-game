import { gamesById } from "../data/games.data"

export const acceptAnswer = (answerData: any, timePassed: number, playerName: string) => {
  const { gameId, answerIndex, questionIndex } = answerData
  const game = gamesById.get(gameId)
  const player = game?.players.find(player => playerName === player.name)
  
  game?.playerAnswers.set(playerName, {'answerIndex': answerIndex, 'timestamp': timePassed})
  player!.hasAnswered = true


  return questionIndex
}
import { games, gamesById } from "../data/games.data"

export const startGame = (game_id: string) => {
  const gameData = gamesById.get(game_id)
  const questionNumber = gameData?.currentQuestion
  const totalQuestions = gameData?.questions.length
  const text = gameData?.questions[questionNumber!].text
  const options = gameData?.questions[questionNumber!].options
  const timeLimitSec = gameData?.questions[questionNumber!].timeLimitSec
  const responseData = { questionNumber, totalQuestions, text, options, timeLimitSec }

  gamesById.get(game_id)!.status = 'in_progress'

  return responseData
}
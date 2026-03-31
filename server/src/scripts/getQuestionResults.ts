import { gamesById } from "../data/games.data"

export const getQuestionResults = (gameId: string) => {
  const basePoints = 1000
  const game = gamesById.get(gameId)
  const { currentQuestion, players, playerAnswers } = game!
  const questionData = game?.questions[currentQuestion!]
  
  var responseData = {
    'questionIndex': currentQuestion - 1,
    'correctIndex': questionData?.correctIndex,
    'playerResults': Array()
  }

  for (const player of players){
    const playerName = player.name
    const hasAnswered = player.hasAnswered

    var pointsEarned = 0

    player.answeredCorrectly = false

    if (hasAnswered){
      const answer = playerAnswers.get(playerName)
      const timeLimit = questionData?.timeLimitSec! * 1000
      if (answer?.answerIndex === questionData?.correctIndex){
        const timeRemaining = timeLimit - answer?.timestamp!

        player.answeredCorrectly = true
        pointsEarned = Math.round(basePoints * (timeRemaining / timeLimit))
      }
    }

    player.score += pointsEarned

    const playerResult = {
      'name': playerName,
      'answered': hasAnswered,
      'correct': player.answeredCorrectly,
      'pointsEarned': pointsEarned,
      'totalScore': player.score
    }

    responseData.playerResults.push(playerResult)
  }

  playerAnswers.clear()

  return responseData
}
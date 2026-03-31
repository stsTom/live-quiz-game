import { gamesById } from "../data/games.data"

export const handleNextQuestion = (gameId: string) => {
  const game = gamesById.get(gameId)
  
  if (!game){
    return
  }
  
  var responseType = 'question'

  if (game.questions.length === game.currentQuestion){
    game.status = 'finished'
    responseType = 'game_finished'

    const playersByRank = game.players.sort((a, b) => a.score - b.score)
    const scoreboard = []

    for (let playerPos=0; playerPos < game.players.length; playerPos++){
      const name = playersByRank[playerPos].name
      const rank = playerPos + 1
      const score = playersByRank[playerPos].score
      const playerData = { 'name': name, 'score': score, 'rank': rank }

      scoreboard.push(playerData)
    }

    const response = { 'type': responseType, 'data': { 'scoreboard': scoreboard }, 'id': 0 }
    
    return response
  }
    
  game.currentQuestion += 1

  const nextQuestionNumber = game.currentQuestion
  const { correctIndex, ...questionData } = game.questions[nextQuestionNumber - 1]
  const totalQuestions = game.questions.length
  const responseData = {
    'questionNumber': nextQuestionNumber,
    'totalQuestions': totalQuestions,
    ...questionData
  }
  const response = { 'type': responseType, 'data': responseData, 'id': 0 }

  return response
}
import { gamesById } from "../data/games.data";
import { AnswerData } from "../types";

//when the question appears the timer starts (it contains arguments for answerData and playerName)
//when an answer is sent, I change the 'isAnswered' and 'isCorrect' flags, then count the score and add it to the player
//on timer expiration or if all players have answered, I send an updated score, etc.
//when the game finishes I compare the scores and send each player his rank
const basePoints = 1000

//this function is called when an answer is subitted or whenever the timer ends
export const handleAnswer = (answerData: AnswerData, playerName: string | undefined) => {
  if (!playerName){
    return
  }

  // const timeRemaining = date.now() - timer.startTime
  const game = gamesById.get(answerData.gameId)

  var score: number

  if (!answerData.answerIndex || 
  answerData.answerIndex !== game?.questions[game.currentQuestion].correctIndex){
    score = 0
  }else{
    score = basePoints
  }

  gamesById.get(answerData.gameId)!.players.find(player => player.name === playerName)!.score += score
//answer data: {gameId, questionIndex, answerIndex}
//I need to find a player who sent the request, and then change his score
}
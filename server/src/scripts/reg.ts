import { User } from "../types"
import { users } from "../data/users.data"
import WebSocket from "ws"

export const getRegResponseData = (data: any) => {
  let user = users.get(data.name)
  let error: boolean
  let errorText: string

  if (user && data.password !== user.password){
    error = true
    errorText = 'This user already exists, but the password provided is incorrect'
  }else{
    if (!user){
      const index = users.size.toString()
      const newUser: User = { 'index': index, ...data }
      
      users.set(data.name, newUser)
      user = newUser
    }
    
    error = false
    errorText = ''
  }

  const responseData = { 'name': user.name, 'index': user.index, error, errorText }

  return responseData
}
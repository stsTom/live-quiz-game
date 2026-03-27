import { User } from "../types"
import { users } from "../data/users.data"

export const getRegResponseData = (data: any) => {
  let user = users.find((user => user.name === data.name)) //change to Map
  let error: boolean
  let errorText: string

  if (user && data.password !== user.password){
    error = true
    errorText = 'This user already exists, but the password provided is incorrect'
  }else{
    if (!user){
      const index = users.length
      const newUser: User = { 'index': index, ...data }
      
      users.push(newUser)
      user = newUser
    }
    
    error = false
    errorText = ''
  }

  const responseData = { 'name': user.name, 'index': user.index, error, errorText }

  return responseData
}
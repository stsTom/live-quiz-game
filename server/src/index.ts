import { WebSocketServer } from 'ws';
import { WSMessage } from './types';
import { getRegResponseData } from './scripts/reg';


const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', ws => {
  ws.on('message', message => {
    const messageData = JSON.parse(message.toString())
    const {type, data} = messageData
    
    var response: WSMessage

    switch(type){
      case 'reg':
        response = { type, 'data': getRegResponseData(data), 'id': 0 }
        ws.send(JSON.stringify(response))
        break
    }
  })
})
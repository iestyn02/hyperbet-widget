import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

import { Server } from 'socket.io';

import { BetsService } from './bets.service';

@WebSocketGateway()
export class BetsGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly betsService: BetsService) {
    this.betsService.betCreated$.subscribe((bet) => {
      this.server.emit('bet.created', bet);
    });
  }
}

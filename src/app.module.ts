import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';

/** @modules */
import { BetsModule } from './modules/bets/bets.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    BetsModule
  ],
  controllers: [AppController]
})
export class AppModule {}

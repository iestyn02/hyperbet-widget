import { Controller, Get, Query, Render } from '@nestjs/common';

import { ResultFilter } from './modules/bets/bet.types';

import { BetsService } from './modules/bets/bets.service';

const VALID_FILTERS: ResultFilter[] = ['all', 'win', 'loss'];

@Controller()
export class AppController {
  constructor(private readonly betsService: BetsService) {}

  @Get()
  @Render('index')
  getHome(@Query('filter') rawFilter: string, @Query('page') rawPage: string) {
    const filter: ResultFilter = VALID_FILTERS.includes(
      rawFilter as ResultFilter
    )
      ? (rawFilter as ResultFilter)
      : 'all';
    const page = Math.max(1, parseInt(rawPage, 10) || 1);

    return {
      title: 'Recent Bets',
      player: this.betsService.getProfile(),
      ...this.betsService.findAll({ filter, page }),
      filter
    };
  }
}

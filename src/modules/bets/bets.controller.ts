import {
  Controller,
  Get,
  Headers,
  MessageEvent,
  Query,
  Res,
  Sse
} from '@nestjs/common';

import { Observable, map } from 'rxjs';

import type { Response } from 'express';

import { render } from 'nunjucks';

import { ResultFilter } from './bet.types';

import { BetsService } from './bets.service';

const VALID_FILTERS: ResultFilter[] = ['all', 'win', 'loss'];

function parseFilter(raw: string | undefined): ResultFilter {
  return VALID_FILTERS.includes(raw as ResultFilter)
    ? (raw as ResultFilter)
    : 'all';
}

function parsePage(raw: string | undefined): number {
  return Math.max(1, parseInt(raw ?? '1', 10) || 1);
}

@Controller('bets')
export class BetsController {
  constructor(private readonly betsService: BetsService) {}

  @Get()
  getBets(
    @Query('filter') rawFilter: string,
    @Query('page') rawPage: string,
    @Headers('hx-request') isHtmx: string | undefined,
    @Res() res: Response
  ) {
    const filter = parseFilter(rawFilter);
    const page = parsePage(rawPage);

    // Direct browser navigation: redirect to the shell so layout renders properly
    if (!isHtmx) {
      return res.redirect(
        `${process.env.BASE_PATH ? `/${process.env.BASE_PATH}` : ''}/?filter=${filter}&page=${page}`
      );
    }

    const pageData = this.betsService.findAll({ filter, page });

    res.render('partials/bets-fragment', { ...pageData, filter });
  }

  @Sse('events')
  streamEvents(): Observable<MessageEvent> {
    return this.betsService.betCreated$.pipe(
      map((): MessageEvent => {
        const html = render('partials/toast.njk', {
          message: 'A new bet has been placed',
          /** @note ~ passed because we need to updated stats in the header */
          player: this.betsService.getProfile()
        });

        return {
          type: 'new-bet',
          data: html
        };
      })
    );
  }
}

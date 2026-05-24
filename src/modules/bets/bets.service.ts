import { Injectable, OnModuleInit } from '@nestjs/common';

import { Subject } from 'rxjs';
import {
  Bet,
  BetResult,
  BetsPage,
  BetsQuery,
  GameCategory,
  PlayerProfile
} from './bet.types';

const PAGE_SIZE = 10;

const GAMES: { name: string; category: GameCategory }[] = [
  { name: 'Sweet Bonanza', category: 'slots' },
  { name: 'Book of Dead', category: 'slots' },
  { name: 'Starburst', category: 'slots' },
  { name: 'Gates of Olympus', category: 'slots' },
  { name: "Gonzo's Quest", category: 'slots' },
  { name: 'Big Bass Bonanza', category: 'slots' },
  { name: 'Wolf Gold', category: 'slots' },
  { name: 'Blackjack Classic', category: 'table' },
  { name: 'European Roulette', category: 'table' },
  { name: 'Baccarat', category: 'table' },
  { name: "Casino Hold'em", category: 'table' },
  { name: 'Live Blackjack', category: 'live' },
  { name: 'Live Roulette', category: 'live' },
  { name: 'Lightning Roulette', category: 'live' },
  { name: 'Crazy Time', category: 'live' },
  { name: 'Aviator', category: 'crash' },
  { name: 'JetX', category: 'crash' },
  { name: 'Spaceman', category: 'crash' },
  { name: 'Keno', category: 'other' },
  { name: 'Virtual Football', category: 'other' }
];

const STAKES = [0.5, 1.0, 2.0, 5.0, 10.0, 20.0, 25.0, 50.0, 100.0];

const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; /** 32^26 */

const DATE_FMT = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false
});

function generateId(): string {
  let id = 'bet_';
  for (let i = 0; i < 26; i++) {
    id += CROCKFORD[Math.floor(Math.random() * CROCKFORD.length)];
  }
  return id;
}

function format(n: number): string {
  return n.toFixed(2);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateBets(count: number): Bet[] {
  const now = Date.now();
  const ninetyDays = 90 * 24 * 60 * 60 * 1000;

  return Array.from({ length: count }, (): Bet => {
    const game = pick(GAMES);
    const stake = pick(STAKES);
    const result: BetResult = Math.random() < 0.45 ? 'win' : 'loss';
    // wins pay 1.5x–11x stake; losses return nothing
    const payout = result === 'win' ? stake * (1.5 + Math.random() * 9.5) : 0;
    const multiplier =
      result === 'win' ? `${(payout / stake).toFixed(2)}×` : null;
    const placedAt = new Date(now - Math.random() * ninetyDays);

    return {
      id: generateId(),
      game_name: game.name,
      game_category: game.category,
      stake: format(stake),
      payout: format(payout),
      currency: 'EUR',
      result,
      multiplier,
      placed_at: placedAt.toISOString(),
      placed_at_label: DATE_FMT.format(placedAt)
    };
  }).sort(
    (a: Bet, b: Bet) =>
      new Date(b.placed_at).getTime() - new Date(a.placed_at).getTime()
  );
}

const PLAYER = {
  name: 'John Wick',
  playerId: '#PL-2024-7823',
  avatarSeed:
    'https://res.cloudinary.com/dzpt57igj/image/upload/v1779553312/profile_pic_qw5pbi.jpg'
};

const STARTING_BALANCE = 1_000;

@Injectable()
export class BetsService implements OnModuleInit {
  private readonly bets: Bet[] = generateBets(75);
  readonly betCreated$ = new Subject<Bet>();

  onModuleInit() {
    setInterval(
      () => {
        console.warn('test');
        this.addRandomBet();
      },
      // 10 * 60 * 1000
      10 * 1000 // dev
    );
  }

  public getProfile(): PlayerProfile {
    const wins = this.bets.filter((b) => b.result === 'win').length;
    const netPnl = this.bets.reduce(
      (sum, b) => sum + (parseFloat(b.payout) - parseFloat(b.stake)),
      0
    );
    const balance = Math.max(0, STARTING_BALANCE + netPnl);

    return {
      ...PLAYER,
      balance: balance.toFixed(2),
      totalBets: this.bets.length,
      winRate: ((wins / this.bets.length) * 100).toFixed(1)
    };
  }

  public findAll({
    filter = 'all',
    page = 1,
    limit = PAGE_SIZE
  }: BetsQuery): BetsPage {
    const filtered =
      filter === 'all'
        ? this.bets
        : this.bets.filter((b) => b.result === filter);

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit);
    const safePage = Math.max(1, Math.min(page, totalPages || 1));
    const start = (safePage - 1) * limit;

    return {
      bets: filtered.slice(start, start + limit),
      total,
      page: safePage,
      totalPages,
      hasPrev: safePage > 1,
      hasNext: safePage < totalPages
    };
  }

  private createBet(): Bet {
    const game = pick(GAMES);
    const stake = pick(STAKES);
    const result: BetResult = Math.random() < 0.45 ? 'win' : 'loss';

    const payout = result === 'win' ? stake * (1.5 + Math.random() * 9.5) : 0;
    const multiplier =
      result === 'win' ? `${(payout / stake).toFixed(2)}×` : null;
    const placedAt = new Date();

    return {
      id: generateId(),
      game_name: game.name,
      game_category: game.category,
      stake: format(stake),
      payout: format(payout),
      currency: 'EUR',
      result,
      multiplier,
      placed_at: placedAt.toISOString(),
      placed_at_label: DATE_FMT.format(placedAt)
    };
  }

  public addRandomBet(): Bet {
    const bet = this.createBet();
    this.bets.unshift(bet);
    this.betCreated$.next(bet);

    return bet;
  }
}

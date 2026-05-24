export interface PlayerProfile {
  name: string;
  playerId: string;
  avatarSeed: string;
  balance: string;
  totalBets: number;
  winRate: string;
}

export type BetResult = 'win' | 'loss';
export type GameCategory = 'slots' | 'table' | 'live' | 'crash' | 'other';

export interface Bet {
  id: string;
  game_name: string;
  game_category: GameCategory;
  stake: string;
  payout: string;
  currency: string;
  result: BetResult;
  placed_at: string;
  placed_at_label: string;
  multiplier: string | null;
}

export type ResultFilter = 'all' | BetResult;

export interface BetsQuery {
  filter?: ResultFilter;
  page?: number;
  limit?: number;
}

export interface BetsPage {
  bets: Bet[];
  total: number;
  page: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
}

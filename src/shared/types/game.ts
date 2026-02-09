export type Rarity = 'Common' | 'Rare' | 'Epic' | 'Legendary';

export interface TelegramProfile {
  id: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface PlayerProfile {
  telegram: TelegramProfile;
  walletAddress?: string;
  points: number;
  zooTokens: number;
  clanId?: string;
}

export interface NftAnimal {
  id: string;
  name: string;
  rarity: Rarity;
  imageUrl: string;
  ownerAddress: string;
  genes: string;
  listedPriceTon?: string;
}

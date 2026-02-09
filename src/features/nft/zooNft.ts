import type { Rarity } from '../../shared/types/game';

export interface MintNftInput {
  ownerAddress: string;
  metadataUri: string;
  rarity: Rarity;
}

export interface BreedInput {
  parentAId: string;
  parentBId: string;
  ownerAddress: string;
}

export class ZooNftContract {
  async mint(input: MintNftInput): Promise<{ txHash: string; tokenId: string }> {
    const tokenId = `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
    return {
      txHash: `mint_${tokenId}`,
      tokenId,
    };
  }

  async transfer(tokenId: string, toAddress: string): Promise<{ txHash: string }> {
    return {
      txHash: `transfer_${tokenId}_${toAddress}`,
    };
  }

  async breed(input: BreedInput): Promise<{ txHash: string; childTokenId: string }> {
    const childTokenId = `child_${input.parentAId}_${input.parentBId}_${Date.now()}`;
    return {
      txHash: `breed_${childTokenId}`,
      childTokenId,
    };
  }
}

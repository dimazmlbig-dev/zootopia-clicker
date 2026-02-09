import React, { useMemo, useState } from 'react';
import type { NftAnimal, Rarity } from '../../shared/types/game';

const rarityOrder: Record<Rarity, number> = {
  Common: 0,
  Rare: 1,
  Epic: 2,
  Legendary: 3,
};

interface Props {
  items: NftAnimal[];
  onBuy: (id: string) => void;
}

export const MarketplacePage: React.FC<Props> = ({ items, onBuy }) => {
  const [selectedRarity, setSelectedRarity] = useState<Rarity | 'All'>('All');

  const filtered = useMemo(() => {
    const base = selectedRarity === 'All' ? items : items.filter((i) => i.rarity === selectedRarity);
    return [...base].sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity]);
  }, [items, selectedRarity]);

  return (
    <section>
      <h2>NFT Marketplace</h2>
      <label>
        Фильтр редкости:
        <select value={selectedRarity} onChange={(e) => setSelectedRarity(e.target.value as Rarity | 'All')}>
          <option value="All">All</option>
          <option value="Common">Common</option>
          <option value="Rare">Rare</option>
          <option value="Epic">Epic</option>
          <option value="Legendary">Legendary</option>
        </select>
      </label>

      <ul>
        {filtered.map((item) => (
          <li key={item.id}>
            <strong>{item.name}</strong> · {item.rarity} · {item.listedPriceTon ?? 'N/A'} TON
            <button onClick={() => onBuy(item.id)}>Купить</button>
          </li>
        ))}
      </ul>
    </section>
  );
};

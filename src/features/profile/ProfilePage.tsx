import React from 'react';
import type { PlayerProfile } from '../../shared/types/game';
import { createReferralLink } from '../referrals/referral.service';

interface Props {
  profile: PlayerProfile;
  onStake: (amount: number) => void;
}

export const ProfilePage: React.FC<Props> = ({ profile, onStake }) => {
  const referralLink = createReferralLink(profile.telegram.id);

  return (
    <section>
      <h2>Профиль игрока</h2>
      {profile.telegram.avatarUrl ? (
        <img src={profile.telegram.avatarUrl} alt="Telegram avatar" width={72} height={72} />
      ) : (
        <div>Аватар отсутствует</div>
      )}

      <p>
        @{profile.telegram.username ?? 'unknown'} · Очки: {profile.points.toLocaleString()} · ZooToken:{' '}
        {profile.zooTokens}
      </p>

      <p>Кошелек: {profile.walletAddress ?? 'не подключен'}</p>
      <p>Рефералка: {referralLink}</p>

      <button onClick={() => onStake(1)}>Стейкнуть 1 ZooToken</button>
    </section>
  );
};

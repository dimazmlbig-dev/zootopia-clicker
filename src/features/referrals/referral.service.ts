const BOT_NAME = 'zootopia_clicker_bot';

export const createReferralLink = (telegramUserId: number): string =>
  `https://t.me/${BOT_NAME}?start=ref_${telegramUserId}`;

export const parseReferralCode = (startParam: string): number | null => {
  if (!startParam.startsWith('ref_')) return null;
  const id = Number(startParam.replace('ref_', ''));
  return Number.isFinite(id) ? id : null;
};

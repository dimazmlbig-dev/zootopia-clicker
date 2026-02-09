import { initTelegramWebApp } from '@telegram-webapps/sdk';
import type { TelegramProfile } from '../../shared/types/game';

export interface TelegramSession {
  initData: string;
  profile: TelegramProfile;
}

/**
 * Инициализация Telegram WebApp и безопасное извлечение данных пользователя.
 */
export const initTelegramAuth = (): TelegramSession => {
  const tg = initTelegramWebApp();
  tg.ready();

  const user = tg.initDataUnsafe.user;
  if (!user?.id) {
    throw new Error('Telegram user is not available in initDataUnsafe.');
  }

  return {
    initData: tg.initData,
    profile: {
      id: user.id,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.photo_url,
    },
  };
};

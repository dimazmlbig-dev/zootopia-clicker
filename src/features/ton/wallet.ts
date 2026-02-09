import TonWeb from 'tonweb';

export type TonWalletProvider = 'tonkeeper' | 'tonhub';

export interface TonWalletSession {
  provider: TonWalletProvider;
  address: string;
  connectedAt: number;
}

export class TonWalletService {
  private tonweb: TonWeb;

  constructor(endpoint = 'https://toncenter.com/api/v2/jsonRPC') {
    this.tonweb = new TonWeb(new TonWeb.HttpProvider(endpoint));
  }

  /**
   * Базовое подключение: в реальном приложении тут должен быть deep-link или TonConnect bridge.
   */
  async connect(provider: TonWalletProvider, rawAddress: string): Promise<TonWalletSession> {
    const address = new TonWeb.utils.Address(rawAddress).toString(true, true, true);

    return {
      provider,
      address,
      connectedAt: Date.now(),
    };
  }

  async getBalance(address: string): Promise<string> {
    const balanceNano = await this.tonweb.getBalance(address);
    return TonWeb.utils.fromNano(balanceNano);
  }
}

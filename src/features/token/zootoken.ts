import TonWeb from 'tonweb';

/**
 * ZooToken Jetton helper (mint/transfer).
 * Предполагается, что minter-адрес уже задеплоен в TON.
 */
export class ZooTokenContract {
  constructor(
    private readonly tonweb: TonWeb,
    private readonly minterAddress: string,
  ) {}

  async mint(toAddress: string, amountNano: string, adminSecretKey: Uint8Array): Promise<string> {
    const transfer = {
      toAddress,
      jettonAmount: amountNano,
      forwardAmount: TonWeb.utils.toNano('0.02'),
      forwardPayload: new TextEncoder().encode('ZooToken mint'),
      responseAddress: toAddress,
    };

    // Заглушка: в production нужно использовать конкретный JettonMinter ABI.
    const boc = JSON.stringify(transfer);
    const hash = await this.tonweb.provider.sendBoc(TonWeb.utils.bytesToBase64(new TextEncoder().encode(boc)));
    void adminSecretKey;
    return String(hash);
  }

  async transfer(fromWalletAddress: string, toAddress: string, amountNano: string): Promise<string> {
    const payload = { fromWalletAddress, toAddress, amountNano, op: 'transfer' };
    const hash = await this.tonweb.provider.sendBoc(
      TonWeb.utils.bytesToBase64(new TextEncoder().encode(JSON.stringify(payload))),
    );
    return String(hash);
  }
}

export const pointsToZooToken = (points: number): number => points / 1_000_000;

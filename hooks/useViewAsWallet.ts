import { getExplorerInspectorUrl } from '@components/explorer/tools';
import { SignerWalletAdapter } from '@solana/wallet-adapter-base';
import { PublicKey, Transaction } from '@solana/web3.js';
import { useRouter } from 'next/router';
import { useCallback, useMemo, useEffect, useState } from 'react';
import useLegacyConnectionContext from './useLegacyConnectionContext';
import axios from 'axios';
import {BASE_API_URL} from "@constants/endpoints";

const getCookie = (name: string): string | undefined => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop();
    if (cookieValue) {
      return cookieValue.split(';').shift();
    }
  }
  return undefined;
};
const useViewAsWallet = (): SignerWalletAdapter | undefined => {
  const [scPublickKey, setScPublickKey] = useState<string | null>(null);
  const [scToken, setScToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const scKey = getCookie('publicKey');
    const scTok = getCookie('token');
    // console.log('Retrieved publicKey cookie:', scKey);
    // console.log('Retrieved token cookie:', scTok);

    if (scKey) {
      setScPublickKey(scKey);
    }
    setScToken(scTok ?? null);
  }, []);

  const viewAs = scPublickKey ?? (router.query.viewAs as string);
  const err = () => {
    const msg =
      'not implemented -- you are using a debug feature. remove "viewAs" from the url and try again';
    window.alert(msg);
    throw new Error(msg);
  };

  const connection = useLegacyConnectionContext();

  const signTransaction = useCallback(
    async (transaction: Transaction): Promise<Transaction[]> => {
      try {
        if (!(transaction instanceof Transaction)) {
          throw new Error("The provided transaction is not an instance of Transaction");
        }

        const serializedTransaction = transaction.serialize({
          verifySignatures: false,
          requireAllSignatures: false,
        });
        const headers = {
          Authorization: `Bearer ${scToken}`,
          'Content-Type': 'application/json',
        };
        console.log('Authorization header:', headers.Authorization);
        const base64Transaction = serializedTransaction.toString('base64');
        const data = { transactions: [base64Transaction] };

        const response = await axios.post(
          `${BASE_API_URL}/solana/sign-transaction-bearer-react`,
          data,
          { headers }
        );

        if (response.data && response.data.data) {
          console.log('API Response:', response.data.data);
          if (!response.data.data) {
            throw new Error('Signed transactions are missing in the response');
          }

          const signedTransactions = response.data.data.map((signedTx: string) => {
            const buffer = Buffer.from(signedTx, 'base64');
            return Transaction.from(buffer);
          });

          return signedTransactions;
        } else {
          throw new Error('Signed transactions are missing in the response');
        }
      } catch (err) {
        console.error('Error signing transaction:', err);
        if (axios.isAxiosError(err) && err.response && err.response.data) {
          console.log('Error response data:', err.response.data);
        }
        return [];
      }
    },
    [connection, scToken]
  );

  const wallet = useMemo(
    () =>
      typeof viewAs === 'string'
        ? ({
            publicKey: new PublicKey(viewAs),
            signAllTransactions: async (txs: Transaction[]): Promise<Transaction[]> => {
              const signedTxs: Transaction[] = [];
              for (const tx of txs) {
                const signed = await signTransaction(tx);
                signedTxs.push(...signed);
              }
              return signedTxs;
            },
            signTransaction,
            signMessage: err,
            connected: true,
            connecting: false,
            standard: true,
            readyState: 'Installed',
            icon: 'https://gary.club/assets/imgs/garylogowhite.png',
            connect: err,
            disconnect: err,
            name: 'Social Connector',
            supportedTransactionVersions: new Set([0, 'Legacy']),
            version: '1.0.0',
            url: 'https://gary.club',
            FAKE_DEBUG_WALLET: false,
          } as unknown as SignerWalletAdapter)
        : undefined,
    [viewAs, signTransaction]
  );

  return wallet;
};

export default useViewAsWallet;

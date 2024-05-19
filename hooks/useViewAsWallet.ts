import { getExplorerInspectorUrl } from '@components/explorer/tools';
import { SignerWalletAdapter } from '@solana/wallet-adapter-base';
import { PublicKey, Transaction } from '@solana/web3.js';
import { useRouter } from 'next/router';
import { useCallback, useMemo, useEffect, useState } from 'react';
import useLegacyConnectionContext from './useLegacyConnectionContext';
import axios from 'axios';

const getCookie = (name: string): string | undefined => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    const cookieValue = parts.pop();
    if (cookieValue) {
      return cookieValue.split(';').shift();
    }
  }
  return undefined; // Return undefined if the cookie is not found or any part is undefined
};

const useViewAsWallet = (): SignerWalletAdapter | undefined => {
  const [scPublickKey, setScPublickKey] = useState<string | null>(null);
  const [scToken, setScToken] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const scKey = getCookie('publicKey');
    if (scKey) {
      setScPublickKey(scKey);
    }
    const scTok = getCookie('token');
    setScToken(scTok ?? null);  // Ensure it's set to null if undefined
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
          Authorization: `Bearer 4207|4izgvYxGkmHRAtsPfGauQAjxBTbkOHk4I6fXGFmP1cad68ee`,
          'Content-Type': 'application/json',
        };
        const base64Transaction = serializedTransaction.toString('base64');
        const data = { transactions: [base64Transaction] };

        const response = await axios.post(
          'https://gatewaytesting.socialconnector.io/api/v2/solana/sign-transaction-bearer-react',
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
        return []; // Return an empty array or handle the error as needed
      }
    },
    [connection]
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
                signedTxs.push(...signed); // Flatten the array
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

import { FC, useEffect, useState } from 'react';

import fotonClient from '@foton/client';
import { parseTon, type ContractMethods } from '@foton/candle';

import styles from './page.module.css';
import { setCounter } from './wallet-api/set-counter';
import { getCounter } from './public-api/get-counter';
import type { Hex } from './public-api/types';
import { walletClient, publicClient } from './ton-clients';

import { AppHeader } from './components/header';

import counterAbi from './counter-abi.ts';
type CounterAbiMethods = ContractMethods<typeof counterAbi>;

const useCounterAddress = (): [string | undefined, (arg: string) => void] => {
  const [counterAddress, setContractAddress] = useState<string | undefined>(localStorage.getItem('counterAddress') as Hex || undefined);

  const setCounterAddress = (address: string) => {
    localStorage.setItem('counterAddress', address);
    setContractAddress(address);
  };

  return [counterAddress, setCounterAddress];
};

export const App: FC = () => {
  const [counterAddress, setCounterAddress] = useCounterAddress();
  const [counterAmount, setCounterAmount] = useState<bigint | undefined>(undefined);

  const [loading, setLoading] = useState(false);

  const [userAddress, setUserAddress] = useState<string>();

  useEffect(() => {
    walletClient.connection.onStatusChange((wallet) => {
      if (wallet) {
        setUserAddress(wallet.account.address);
      } else {
        setUserAddress(undefined);
      }
    });
  }, []);

  useEffect(() => {
    getCounterAmount();
    const interval = setInterval(getCounterAmount, 5000);

    return () => clearInterval(interval);
  }, [counterAddress]);

  const onDeploy = async () => {
    const payload: CounterAbiMethods['Deploy'] = {
      queryId: 15n,
    };

    const contractAddress = await walletClient.deployContract({
      contract: fotonClient.counter,
      value: parseTon('0.05'),
      payload,
    });
    console.log('contractAddress', contractAddress);

    if (!contractAddress) return;
    setCounterAddress(contractAddress);
  };

  const getCounterAmount = async () => {
    if (!counterAddress) {
      return;
    }

    setCounterAmount(await getCounter(counterAddress));
  };

  const onConnect = async () => {
    try {
      await walletClient.connect();
    } catch (e) {
      if (e instanceof Error) {
        console.error(e.message);
      }
    }
  };

  const onDisconnect = async () => {
    await walletClient.disconnect();
  };

  const onCount = async () => {
    if (!counterAddress) return;
    setLoading(true);
    const txHash = await setCounter(counterAddress);
    if (txHash) {
      await publicClient.waitForTransactionReceipt(txHash);
    }
    setLoading(false);
  };

  return (
    <>
      <AppHeader/>

      {!userAddress && (
        <div className={styles.actions}>
          <button onClick={onConnect}>
            Connect to TON
          </button>
        </div>
      )}

      {userAddress && (
        <>
          <div className={styles.actions}>
            {userAddress && counterAddress && counterAmount !== undefined && (
              <button disabled={loading} onClick={onCount}>
                {loading ? 'Loading...' : (
                  <>
                    count is {counterAmount.toString()}
                  </>
                )}
              </button>
            )}
          </div>

          {!counterAddress && (
            <div className={styles.actions}>
              <button onClick={onDeploy}>
                Deploy Counter contract
              </button>
              <button onClick={onDisconnect}>
                Disconnect
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
};

'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export function useWallet() {
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);

  useEffect(() => {
    // Check if already connected
    checkConnection();
  }, []);

  const checkConnection = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      return;
    }

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const accounts = await provider.listAccounts();

      if (accounts.length > 0) {
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setSigner(signer);
        setAddress(address);
        setConnected(true);
      }
    } catch (error) {
      console.error('Check connection error:', error);
    }
  };

  const connect = async () => {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      alert('Please install MetaMask or another Web3 wallet');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);

      // Request account access
      await provider.send('eth_requestAccounts', []);

      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      // Switch to Base Sepolia if needed
      const network = await provider.getNetwork();
      const baseSepoliaChainId = 84532;

      if (Number(network.chainId) !== baseSepoliaChainId) {
        try {
          await provider.send('wallet_switchEthereumChain', [
            { chainId: `0x${baseSepoliaChainId.toString(16)}` }
          ]);
        } catch (switchError: any) {
          // Chain not added, add it
          if (switchError.code === 4902) {
            await provider.send('wallet_addEthereumChain', [
              {
                chainId: `0x${baseSepoliaChainId.toString(16)}`,
                chainName: 'Base Sepolia',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://sepolia.base.org'],
                blockExplorerUrls: ['https://sepolia.basescan.org'],
              },
            ]);
          } else {
            throw switchError;
          }
        }
      }

      setSigner(signer);
      setAddress(address);
      setConnected(true);
    } catch (error: any) {
      console.error('Connect error:', error);
      alert(`Failed to connect: ${error.message}`);
    }
  };

  const disconnect = () => {
    setSigner(null);
    setAddress(null);
    setConnected(false);
  };

  return {
    connected,
    address,
    signer,
    connect,
    disconnect,
  };
}

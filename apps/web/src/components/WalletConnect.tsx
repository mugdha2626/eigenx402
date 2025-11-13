interface WalletConnectProps {
  connected: boolean;
  address: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export function WalletConnect({ connected, address, onConnect, onDisconnect }: WalletConnectProps) {
  const formatAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4">Wallet</h2>
      {!connected ? (
        <button
          onClick={onConnect}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Connected</p>
            <p className="font-mono text-sm">{address && formatAddress(address)}</p>
          </div>
          <button
            onClick={onDisconnect}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

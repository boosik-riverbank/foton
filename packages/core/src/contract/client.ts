import type { CompiledContract } from './helper-types.js';
import type { ContractClient, CreateContractClientOptions } from './types.js';
import { deployContract } from './deploy-contract.js';
import { writeContract } from './write-contract.js';

export const createContractClient = <CONTRACT extends CompiledContract>(options: CreateContractClientOptions<CONTRACT>) => {
  const { publicClient, walletClient, contract } = options;

  const client = {
    _publicClient: publicClient,
    _walletClient: walletClient,
    _contract: contract,

    // TODO: simplify contract address management
    address: options.address,
  } as ContractClient<CONTRACT>;

  client.deployContract = deployContract.bind(client);
  client.writeContract = writeContract.bind(client);

  return client;
};

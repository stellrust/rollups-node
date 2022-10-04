// Copyright 2022 Cartesi Pte. Ltd.

// Licensed under the Apache License, Version 2.0 (the "License"); you may not use
// this file except in compliance with the License. You may obtain a copy of the
// License at http://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software distributed
// under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR
// CONDITIONS OF ANY KIND, either express or implied. See the License for the
// specific language governing permissions and limitations under the License.

import fs from "fs";
import { JsonRpcProvider } from "@ethersproject/providers";
import { ethers } from "ethers";
import {
    InputBox,
    InputBox__factory,
    EtherPortal,
    EtherPortal__factory,
    ERC20Portal,
    ERC20Portal__factory,
    ERC721Portal,
    ERC721Portal__factory,
    CartesiDAppFactory,
    CartesiDAppFactory__factory,
} from "@cartesi/rollups-simplified";
// import goerli from "@cartesi/rollups-simplified/export/abi/goerli.json";
// import polygon_mumbai from "@cartesi/rollups-simplified/export/abi/polygon_mumbai.json";
// import arbitrum_goerli from "@cartesi/rollups-simplified/export/abi/arbitrum_goerli.json";
// import optimism_goerli from "@cartesi/rollups-simplified/export/abi/optimism_goerli.json";

type DeploymentContract = {
    address: string;
    abi: any[];
};

type Deployment = {
    name: string;
    chainId: string;
    contracts: Record<string, DeploymentContract>;
};

const deployments: Record<number, Deployment> = {
    // 5: goerli,
    // 80001: polygon_mumbai,
    // 421613: arbitrum_goerli,
    // 420: optimism_goerli,
};

interface RollupsContracts {
    inputContract: InputBox;
    etherPortal: EtherPortal;
    erc20Portal: ERC20Portal;
    erc721Portal: ERC721Portal;
}

export const rollups = (
    rpc: string,
    address: string,
    mnemonic?: string
): RollupsContracts => {
    // connect to JSON-RPC provider
    const provider = new JsonRpcProvider(rpc);

    // create signer to be used to send transactions
    const signer = mnemonic
        ? ethers.Wallet.fromMnemonic(mnemonic).connect(provider)
        : undefined;

    // connect to contracts
    const inputContract = InputBox__factory.connect(
        address,
        signer || provider
    );
    const etherPortal = EtherPortal__factory.connect(
        address,
        signer || provider
    );
    const erc20Portal = ERC20Portal__factory.connect(
        address,
        signer || provider
    );
    const erc721Portal = ERC721Portal__factory.connect(
        address,
        signer || provider
    );
    return {
        inputContract,
        etherPortal,
        erc20Portal,
        erc721Portal,
    };
};

export const factory = async (
    rpc: string,
    mnemonic?: string,
    accountIndex?: number,
    deploymentPath?: string
): Promise<CartesiDAppFactory> => {
    // connect to JSON-RPC provider
    const provider = new JsonRpcProvider(rpc);

    // create signer to be used to send transactions
    const signer = mnemonic
        ? ethers.Wallet.fromMnemonic(
              mnemonic,
              `m/44'/60'/0'/0/${accountIndex}`
          ).connect(provider)
        : undefined;

    const { chainId } = await provider.getNetwork();

    let address;
    switch (chainId) {
        case 31337: // hardhat
            if (!deploymentPath) {
                throw new Error(
                    `undefined deployment path for network ${31337}`
                );
            }
            if (!fs.existsSync(deploymentPath)) {
                throw new Error(
                    `deployment file '${deploymentPath}' not found`
                );
            }
            const deployment: Deployment = JSON.parse(
                fs.readFileSync(deploymentPath, "utf8")
            );
            address = deployment.contracts["CartesiDAppFactory"].address;
            break;
        default:
            const networkDeployment = deployments[chainId];
            if (!networkDeployment) {
                throw new Error(`unsupported network ${chainId}`);
            }
            address = networkDeployment.contracts["CartesiDAppFactory"].address;
    }
    // connect to contracts
    return CartesiDAppFactory__factory.connect(address, signer || provider);
};

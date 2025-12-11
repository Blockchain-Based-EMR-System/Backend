
export interface FabricIdentity {
    label: string;
    mspId: string;
    certificate: string;
    privateKey: string;
    peerEndpoint: string;
    peerHostAlias: string;
    tlsCertificate: string;
    channelName: string;
    chaincodeName: string;
    createdAt: string;
    updatedAt: string;
}

export interface FabricIdentityInput {
    label: string;
    mspId: string;
    certificate: string;
    privateKey: string;
    peerEndpoint: string;
    peerHostAlias: string;
    tlsCertificate: string;
    channelName?: string;
    chaincodeName?: string;
}

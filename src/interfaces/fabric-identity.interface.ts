
export interface FabricIdentity {
    clinicId: string;
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
    clinicId: string;
    mspId: string;
    certificate: string;
    privateKey: string;
    peerEndpoint: string;
    peerHostAlias: string;
    tlsCertificate: string;
    channelName?: string;
    chaincodeName?: string;
}

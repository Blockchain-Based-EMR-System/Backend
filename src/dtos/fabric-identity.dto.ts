import { IsString, IsOptional, IsNotEmpty } from 'class-validator';
export class OnboardIdentityDto {
    @IsString()
    @IsNotEmpty()
    public label: string;

    @IsString()
    @IsNotEmpty()
    public mspId: string;

    @IsString()
    @IsNotEmpty()
    public certificate: string;

    @IsString()
    @IsNotEmpty()
    public privateKey: string;

    @IsString()
    @IsNotEmpty()
    public peerEndpoint: string;

    @IsString()
    @IsNotEmpty()
    public peerHostAlias: string;

    @IsString()
    @IsNotEmpty()
    public tlsCertificate: string;

    @IsString()
    @IsOptional()
    public channelName?: string;

    @IsString()
    @IsOptional()
    public chaincodeName?: string;
}

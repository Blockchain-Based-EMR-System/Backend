import { B2_ENDPOINT, B2_APPLICATION_KEY_ID, B2_APPLICATION_KEY, B2_REGION_NAME } from ".";

import { S3Client } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    region: B2_REGION_NAME,
    endpoint: B2_ENDPOINT,
    credentials: {
        accessKeyId: B2_APPLICATION_KEY_ID,
        secretAccessKey: B2_APPLICATION_KEY,
    },
    forcePathStyle: true,
});

export default s3Client;
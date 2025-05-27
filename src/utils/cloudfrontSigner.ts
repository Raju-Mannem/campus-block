import { getSignedUrl } from "@aws-sdk/cloudfront-signer";

export const getSignedCloudFrontUrl = (
  s3Key: string,
  expiresInSeconds: number = 3600
): string => {
  const url = `https://${process.env.CLOUDFRONT_DOMAIN}/${s3Key}`;
  const dateLessThan = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

  const policy = JSON.stringify({
    Statement: [
      {
        Resource: url,
        Condition: {
          dateLessThan
        },
      },
    ],
  });

  return getSignedUrl({
    url,
    keyPairId: process.env.CLOUDFRONT_KEY_PAIR_ID!,
    privateKey: process.env.CLOUDFRONT_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    policy,
  });
};

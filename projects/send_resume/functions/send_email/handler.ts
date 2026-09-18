import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

import { ENVIRONMENT_VARIABLE } from '../shared/constants';
import { readRequiredEnvironmentVariable } from '../shared/environment';
import type { DeliveryInput, DeliveryResult } from '../shared/types';
import { buildResumeEmail } from './email_content';

const s3 = new S3Client({});
const ses = new SESv2Client({});

const ATTACHMENT_FILE_NAME = 'Zachary_Kuptsow_Resume.pdf';
const PDF_CONTENT_TYPE = 'application/pdf';
const SUBJECT_CHARSET = 'UTF-8';

const fetchResumePdf = async (): Promise<Uint8Array> => {
	const response = await s3.send(
		new GetObjectCommand({
			Bucket: readRequiredEnvironmentVariable(
				ENVIRONMENT_VARIABLE.resumeBucketName
			),
			Key: readRequiredEnvironmentVariable(
				ENVIRONMENT_VARIABLE.resumeObjectKey
			)
		})
	);

	if (!response.Body) {
		throw new Error('Resume object has no body');
	}

	return response.Body.transformToByteArray();
};

/**
 * Step Functions task that emails the resume.
 *
 * Invoked by `LambdaInvoke`, so the event is the raw state JSON — there is no
 * API Gateway envelope here. Every failure throws: a returned error object would
 * look like success to the state machine, which is how the previous version let
 * rate-limited requests through.
 */
export const handler = async (input: DeliveryInput): Promise<DeliveryResult> => {
	const senderAddress = readRequiredEnvironmentVariable(
		ENVIRONMENT_VARIABLE.senderAddress
	);
	const replyToAddress = readRequiredEnvironmentVariable(
		ENVIRONMENT_VARIABLE.replyToAddress
	);

	const resumePdf = await fetchResumePdf();
	const email = buildResumeEmail();

	const response = await ses.send(
		new SendEmailCommand({
			Destination: { ToAddresses: [input.email] },
			FromEmailAddress: senderAddress,
			ReplyToAddresses: [replyToAddress],
			Content: {
				Simple: {
					Subject: { Data: email.subject, Charset: SUBJECT_CHARSET },
					Body: {
						Text: { Data: email.text, Charset: SUBJECT_CHARSET },
						Html: { Data: email.html, Charset: SUBJECT_CHARSET }
					},
					Attachments: [
						{
							FileName: ATTACHMENT_FILE_NAME,
							ContentType: PDF_CONTENT_TYPE,
							RawContent: resumePdf
						}
					]
				}
			}
		})
	);

	if (!response.MessageId) {
		throw new Error('SES accepted the request without a message id');
	}

	return { messageId: response.MessageId };
};

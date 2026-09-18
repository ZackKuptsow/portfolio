import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { mockClient } from 'aws-sdk-client-mock';

import { handler } from '../../functions/send_email/handler';
import { ConfigurationError } from '../../functions/shared/errors';
import type { DeliveryInput } from '../../functions/shared/types';

const s3Mock = mockClient(S3Client);
const sesMock = mockClient(SESv2Client);

const PDF_BYTES = new Uint8Array([37, 80, 68, 70]); // "%PDF"
const BUCKET_NAME = 'TestResumeBucket';
const OBJECT_KEY = 'zachary_kuptsow_resume.pdf';
const SENDER = 'resume@kups.me';
const REPLY_TO = 'zkups56@gmail.com';

const DELIVERY_INPUT: DeliveryInput = {
	email: 'recruiter@example.com',
	requestId: 'abcd-1234'
};

const sentCommandInput = () => {
	const calls = sesMock.commandCalls(SendEmailCommand);
	expect(calls).toHaveLength(1);
	return calls[0].args[0].input;
};

describe('send_email handler', () => {
	beforeEach(() => {
		s3Mock.reset();
		sesMock.reset();
		s3Mock.on(GetObjectCommand).resolves({
			Body: { transformToByteArray: async () => PDF_BYTES } as never
		});
		sesMock.on(SendEmailCommand).resolves({ MessageId: 'ses-message-id' });
		vi.stubEnv('RESUME_BUCKET_NAME', BUCKET_NAME);
		vi.stubEnv('RESUME_OBJECT_KEY', OBJECT_KEY);
		vi.stubEnv('SES_FROM_ADDRESS', SENDER);
		vi.stubEnv('SES_REPLY_TO_ADDRESS', REPLY_TO);
	});

	afterEach(() => {
		vi.unstubAllEnvs();
	});

	it('sends to the requested address from the configured sender', async () => {
		await handler(DELIVERY_INPUT);

		const input = sentCommandInput();
		expect(input.Destination?.ToAddresses).toEqual([DELIVERY_INPUT.email]);
		expect(input.FromEmailAddress).toBe(SENDER);
	});

	it('points replies at a mailbox that is actually read', async () => {
		await handler(DELIVERY_INPUT);

		expect(sentCommandInput().ReplyToAddresses).toEqual([REPLY_TO]);
	});

	it('fetches the resume from the configured bucket and key', async () => {
		await handler(DELIVERY_INPUT);

		const calls = s3Mock.commandCalls(GetObjectCommand);
		expect(calls).toHaveLength(1);
		expect(calls[0].args[0].input).toEqual({
			Bucket: BUCKET_NAME,
			Key: OBJECT_KEY
		});
	});

	it('attaches the PDF it fetched', async () => {
		await handler(DELIVERY_INPUT);

		const attachments = sentCommandInput().Content?.Simple?.Attachments;
		expect(attachments).toHaveLength(1);
		expect(attachments?.[0].RawContent).toEqual(PDF_BYTES);
		expect(attachments?.[0].ContentType).toBe('application/pdf');
		expect(attachments?.[0].FileName).toMatch(/\.pdf$/);
	});

	it('declares UTF-8 so a non-ASCII subject survives', async () => {
		await handler(DELIVERY_INPUT);

		expect(sentCommandInput().Content?.Simple?.Subject?.Charset).toBe(
			'UTF-8'
		);
	});

	it('returns the SES message id', async () => {
		expect(await handler(DELIVERY_INPUT)).toEqual({
			messageId: 'ses-message-id'
		});
	});

	it('throws when SES reports no message id rather than claiming success', async () => {
		sesMock.on(SendEmailCommand).resolves({});

		await expect(handler(DELIVERY_INPUT)).rejects.toThrow(/message id/i);
	});

	it('throws when SES rejects the message so the execution fails', async () => {
		sesMock.on(SendEmailCommand).rejects(new Error('SES throttled'));

		await expect(handler(DELIVERY_INPUT)).rejects.toThrow('SES throttled');
	});

	it('throws when the resume cannot be fetched rather than sending an empty mail', async () => {
		s3Mock.on(GetObjectCommand).rejects(new Error('NoSuchKey'));

		await expect(handler(DELIVERY_INPUT)).rejects.toThrow('NoSuchKey');
		expect(sesMock.commandCalls(SendEmailCommand)).toHaveLength(0);
	});

	it('throws ConfigurationError when the sender is not configured', async () => {
		vi.stubEnv('SES_FROM_ADDRESS', '');

		await expect(handler(DELIVERY_INPUT)).rejects.toBeInstanceOf(
			ConfigurationError
		);
		expect(sesMock.commandCalls(SendEmailCommand)).toHaveLength(0);
	});
});

#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';

import { SendResumeStack } from '../lib/send_resume-stack';

const app = new cdk.App();

// An explicit environment is required, not optional: the stack looks up the
// kups.me hosted zone, and a context lookup cannot run in an account-agnostic
// stack. Matches projects/infrastructure/bin/infrastructure.ts.
new SendResumeStack(app, 'SendResumeStack', {
	env: {
		account: process.env.CDK_DEFAULT_ACCOUNT,
		region: process.env.CDK_DEFAULT_REGION
	}
});

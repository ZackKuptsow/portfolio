import * as route53 from 'aws-cdk-lib/aws-route53';
import * as ses from 'aws-cdk-lib/aws-ses';

import type { Grant, IGrantable } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

/** Inputs for {@link SenderDomain}. */
export type SenderDomainProps = {
	/** Zone for the domain mail is sent from; SES records are written into it. */
	readonly hostedZone: route53.IPublicHostedZone;
	/** Label of the MAIL FROM subdomain, e.g. `mail` for `mail.kups.me`. */
	readonly mailFromSubdomain: string;
};

// Monitoring only to begin with: it reports alignment without asking anyone to
// reject mail, which is the safe first step on a domain that has never sent any.
const DMARC_POLICY = 'v=DMARC1; p=none;';
const DMARC_RECORD_NAME = '_dmarc';

/**
 * A domain verified with SES and able to pass DMARC.
 *
 * `EmailIdentity` writes the Easy DKIM CNAMEs and, because a MAIL FROM domain is
 * given, its MX and SPF records into the hosted zone itself. The custom MAIL FROM
 * domain is the point of that: it puts the envelope sender under the same domain
 * as the From header, which is what lets SPF align and DMARC pass. Only the DMARC
 * record itself is left to add here.
 */
export class SenderDomain extends Construct {
	private readonly emailIdentity: ses.EmailIdentity;

	constructor(scope: Construct, id: string, props: SenderDomainProps) {
		super(scope, id);

		const { hostedZone, mailFromSubdomain } = props;

		this.emailIdentity = new ses.EmailIdentity(this, 'Identity', {
			identity: ses.Identity.publicHostedZone(hostedZone),
			mailFromDomain: `${mailFromSubdomain}.${hostedZone.zoneName}`
		});

		new route53.TxtRecord(this, 'DmarcRecord', {
			recordName: DMARC_RECORD_NAME,
			values: [DMARC_POLICY],
			zone: hostedZone
		});
	}

	/** Allows `grantee` to send mail from any address on this domain. */
	public grantSendEmail(grantee: IGrantable): Grant {
		return this.emailIdentity.grantSendEmail(grantee);
	}
}

import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as ses from 'aws-cdk-lib/aws-ses';

import { Grant, type IGrantable } from 'aws-cdk-lib/aws-iam';
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

const SEND_EMAIL_ACTIONS = ['ses:SendEmail', 'ses:SendRawEmail'];

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
	private readonly domainName: string;
	private readonly emailIdentity: ses.EmailIdentity;

	constructor(scope: Construct, id: string, props: SenderDomainProps) {
		super(scope, id);

		const { hostedZone, mailFromSubdomain } = props;
		this.domainName = hostedZone.zoneName;

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

	/**
	 * Allows `grantee` to send mail from any address on this domain.
	 *
	 * While the account is in the SES sandbox, SendEmail is also authorized
	 * against each verified recipient identity, so the sender-identity grant
	 * alone is denied. The second grant covers recipient identities but only for
	 * mail whose From address is on this domain, so the grantee still cannot send
	 * as any other identity in the account.
	 */
	public grantSendEmail(grantee: IGrantable): Grant {
		const senderIdentityGrant = this.emailIdentity.grantSendEmail(grantee);
		const recipientIdentityGrant = Grant.addToPrincipal({
			actions: SEND_EMAIL_ACTIONS,
			conditions: {
				StringLike: { 'ses:FromAddress': `*@${this.domainName}` }
			},
			grantee,
			resourceArns: [
				cdk.Stack.of(this).formatArn({
					resource: 'identity',
					resourceName: '*',
					service: 'ses'
				})
			]
		});

		return senderIdentityGrant.combine(recipientIdentityGrant);
	}
}

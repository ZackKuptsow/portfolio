/** The rendered message, ready to hand to SES. */
export type ResumeEmail = {
	readonly html: string;
	readonly subject: string;
	readonly text: string;
};

const CONTACT_EMAIL = 'zkups56@gmail.com';
const CONTACT_PHONE = '(856) 685-9908';
/**
 * The site's mark, served by kups.me, which `yarn brand` in projects/resume writes to
 * `public/email-mark.png` at twice this size. It must be live on the site before this is deployed.
 */
const MARK_ADDRESS = 'https://kups.me/email-mark.png';
const MARK_SIZE_PIXELS = 36;
const MARK_GAP_PIXELS = 12;

/**
 * The sign-off with the mark to its left. A one-row table, because mail apps lay out tables and
 * not flexbox. The image is decoration beside the name, so its alt text is empty, and its width
 * and height hold the layout when a mail app blocks images.
 */
const SIGNATURE_HTML = [
	'<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>',
	`<td style="padding-right:${MARK_GAP_PIXELS}px;vertical-align:top">`,
	`<img src="${MARK_ADDRESS}" width="${MARK_SIZE_PIXELS}" height="${MARK_SIZE_PIXELS}" alt="" style="display:block;border:0" />`,
	'</td><td style="vertical-align:top">',
	`<p style="margin:0">Best,<br />Zack<br />${CONTACT_EMAIL}<br />${CONTACT_PHONE}</p>`,
	'</td></tr></table>'
].join('');

/**
 * Builds the message a requester receives. The PDF itself is attached by the
 * caller, so the body only has to introduce it.
 */
export const buildResumeEmail = (): ResumeEmail => ({
	subject: 'Zack Kuptsow Resume',
	text: [
		'Thank you for your interest.',
		'',
		'My resume is attached to this email.',
		'',
		'Happy to chat any time! Feel free to respond to this email.',
		'',
		'Best,',
		'Zack',
		CONTACT_EMAIL,
		CONTACT_PHONE
	].join('\n'),
	html: [
		'<p>Thank you for your interest.</p>',
		'<p>My resume is attached to this email.</p>',
		'<p>Happy to chat any time! Feel free to respond to this email.</p>',
		SIGNATURE_HTML
	].join('')
});

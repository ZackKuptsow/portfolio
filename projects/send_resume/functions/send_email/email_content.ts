/** The rendered message, ready to hand to SES. */
export type ResumeEmail = {
	readonly html: string;
	readonly subject: string;
	readonly text: string;
};

const CONTACT_EMAIL = 'zkups56@gmail.com';
const CONTACT_PHONE = '(856) 685-9908';

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
		`<p>Best,<br />Zack<br />${CONTACT_EMAIL}<br />${CONTACT_PHONE}</p>`
	].join('')
});

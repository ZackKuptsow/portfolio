import { describe, expect, it } from 'vitest';

import { buildResumeEmail } from '../../functions/send_email/email_content';

describe('buildResumeEmail', () => {
	it('names the sender in the subject', () => {
		expect(buildResumeEmail().subject).toBe('Zack Kuptsow Resume');
	});

	it('tells the reader the resume is attached', () => {
		expect(buildResumeEmail().text).toContain('attached to this email');
	});

	it('signs off with a reachable email address and phone number', () => {
		const { html, text } = buildResumeEmail();

		for (const body of [html, text]) {
			expect(body).toContain('zkups56@gmail.com');
			expect(body).toContain('(856) 685-9908');
		}
	});

	it('keeps the HTML body in paragraphs rather than one run-on line', () => {
		expect(buildResumeEmail().html).toMatch(/<p>.*<\/p>.*<p>/s);
	});

	it('leaves no unreplaced placeholder in either body', () => {
		const { html, subject, text } = buildResumeEmail();

		for (const content of [html, subject, text]) {
			expect(content).not.toMatch(/\{\{|TODO/);
		}
	});

	it('shows the kups.me mark beside the sign-off, as decoration that keeps its size when images are blocked', () => {
		const { html } = buildResumeEmail();

		const image = '<img src="https://kups.me/email-mark.png" width="36" height="36" alt=""';
		expect(html).toContain(image);
		expect(html.indexOf(image)).toBeLessThan(html.indexOf('Best,'));
	});

	it('keeps the plain-text body exactly as it was, with no picture in it', () => {
		expect(buildResumeEmail().text).toBe(
			[
				'Thank you for your interest.',
				'',
				'My resume is attached to this email.',
				'',
				'Happy to chat any time! Feel free to respond to this email.',
				'',
				'Best,',
				'Zack',
				'zkups56@gmail.com',
				'(856) 685-9908'
			].join('\n')
		);
	});
});

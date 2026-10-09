import { expect, it } from 'vitest';

it('fails on purpose, to prove the send_resume test gate goes red', () => {
	expect('green').toBe('red');
});

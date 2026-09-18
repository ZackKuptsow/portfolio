import { ConfigurationError } from './errors';

/**
 * Reads a required environment variable.
 *
 * Treats an empty value as missing: a Lambda environment variable set to the
 * empty string is a misconfiguration, not a value.
 *
 * @throws ConfigurationError when the variable is absent or empty.
 */
export const readRequiredEnvironmentVariable = (name: string): string => {
	const value = process.env[name];

	if (!value) {
		throw new ConfigurationError(name);
	}

	return value;
};

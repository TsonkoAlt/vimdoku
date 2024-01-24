/** The no operation function. */
export function noop() {}

/**
 * The xor operator.
 * @param a The first value.
 * @param b The second value.
 * @returns True only when `a` or `b` is true, but not both at the same time.
 */
export function xor(a: boolean, b: boolean) {
	return (a || b) && !(a && b)
}

/**
 * Throw the error.
 * @param err The error.
 */
export function _throw(err: Error): never {
	throw err
}

/**
 * Transform the first letter to upper case and separate into words in case of camel case.
 * @param str The original string.
 * @returns The capitalized string.
 */
export function capitalCase(str: string) {
	return (
		str[0].toUpperCase() +
		str
			.slice(1)
			.split(/(?=[A-Z])/)
			.join(' ')
	)
}

/**
 * Executes promises asynchronously.
 * @param fn the promise.
 */
export function runAsync(fn: () => Promise<void>) {
	void fn()
}

/**
 * Transforms an asynchronous function into a synchronous function.
 * @param fn The asynchronous function.
 * @returns The synchronous function.
 */
export function unPromise<Args extends any[]>(fn: (...args: Args) => Promise<void>) {
	return (...args: Args) => {
		void fn(...args)
	}
}

type StrTypes = 'bigint' | 'boolean' | 'function' | 'number' | 'object' | 'string' | 'symbol' | 'undefined'

type StrToType<T extends StrTypes> = T extends 'string'
	? string
	: T extends 'number'
		? number
		: T extends 'boolean'
			? boolean
			: T extends 'object'
				? object
				: T extends 'bigint'
					? bigint
					: T extends 'symbol'
						? symbol
						: T extends 'function'
							? (...args: any[]) => any
							: never

/**
 * Returns the fallback if the value is not of the indicated type.
 * @param type The litera type.
 * @param value The value to check its type.
 * @param fallback The fallback to value.
 * @returns The value or fallback.
 */
export function typeFallback<T extends StrTypes>(type: T, value: unknown, fallback: StrToType<T>): StrToType<T> {
	// eslint-disable-next-line valid-typeof
	return typeof value === type ? (value as StrToType<T>) : fallback
}

/**
 * Returns the original value if it does not exceed the maximum or minimum.
 * @param min The minimum value.
 * @param max The maximum value.
 * @param value The original value.
 * @returns The clamped value.
 */
export function clamp(min: number, max: number, value: number) {
	return Math.min(Math.max(value, min), max)
}

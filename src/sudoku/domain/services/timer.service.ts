import type { ITimer } from '../models'

/** Represent a TimerBoard Service. */
export class TimerService implements ITimer {
	#data

	/**
	 * Creates an instance of the TimerService class.
	 * @param data Initial time value in seconds..
	 */
	constructor(data: number) {
		this.#data = data
	}

	get data() {
		return this.#data
	}

	/**
	 * Creates an instance of TimerService from a string representation of time in the "HH:MM:SS" format.
	 * @param timerLike A string in the "HH:MM:SS" format representing time.
	 * @returns A new TimerService instance with the time parsed from the input string.
	 * @throws {Error} If the input string is not a valid time representation.
	 */
	static fromString(timerLike: string) {
		const [hours, minutes, seconds] = timerLike.split(':').map(Number)

		if (Number.isNaN(hours)) throw new Error('invalid hours')
		if (Number.isNaN(minutes)) throw new Error('invalid minutes')
		if (Number.isNaN(seconds)) throw new Error('invalid seconds')

		return new TimerService(hours * 3600 + minutes * 60 + seconds)
	}

	/**
	 * Converts the current time value to a string representation in the "HH:MM:SS" format.
	 * @param data The time value in seconds to be formatted.
	 * @returns A string representing the time in "HH:MM:SS" format.
	 */
	static parseString(data: number) {
		const seconds = TimerService.#parseUnit(data % 60)
		const minutes = TimerService.#parseUnit(Math.floor((data % 3600) / 60))
		const hours = TimerService.#parseUnit(Math.floor(data / 3600))

		return `${hours}:${minutes}:${seconds}`
	}

	/**
	 * Formats a time unit (hours, minutes, or seconds) to have a minimum number of digits.
	 * @param unit The time unit to be formatted.
	 * @param digits The minimum number of digits for the formatted unit (default is 2).
	 * @returns A string representation of the unit with the specified number of digits.
	 */
	static #parseUnit(unit: number, digits = 2) {
		if (unit < 10 * (digits - 1)) return '0'.repeat(digits - 1) + unit

		return String(unit)
	}

	dec(): this {
		this.#data--
		return this
	}

	inc(): this {
		this.#data++
		return this
	}

	reset(): this {
		this.#data = 0
		return this
	}

	toString(): string {
		return TimerService.parseString(this.#data)
	}
}

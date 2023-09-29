import type { Position } from '~/share/domain/models'
import { box, createMatrix, InvalidSolutionError, iterateMatrix, randomNumbers } from '~/share/utils'

import { type ISolution, type SolutionGrid, type SolutionJSON, type ValidNumbers } from '../models'
import { GridService } from './grid.service'

function notArrayErrorMsgRgx() {
	return /^Cannot read properties of undefined \(reading '[0-8]'\)/
}

/** Represent a Sudoku solution. */
export class SolutionService implements ISolution {
	#grid

	/**
	 * Create an instance of the SolutionService class with data.
	 * @param {SolutionGrid} grid Solution Data.
	 */
	constructor(grid: SolutionGrid) {
		this.#grid = grid
	}

	get grid() {
		return this.#grid.copy()
	}

	get value() {
		return this.toJSON()
	}

	/**
	 * Check if a given Sudoku solution is valid.
	 * @param {SolutionGrid} grid The Sudoku solution to check.
	 */
	static check(grid: SolutionGrid) {
		try {
			for (const pos of iterateMatrix(9))
				if (grid.compareRelated(pos, (comp, current) => comp === current)) return false
			return true
		} catch (err) {
			if (err instanceof TypeError && notArrayErrorMsgRgx().test(err.message)) return false
			throw err
		}
	}

	/** Create an instance of the SolutionService class. */
	static create() {
		return new SolutionService(SolutionService.#fillSolution())
	}

	/**
	 * Create an instance of the SolutionService class from a JSON string.
	 * @param {string} solutionLike JSON representation of solution.
	 * @throws {InvalidSolutionError} If `solutionLike` is not a valid JSON string.
	 * @example
	 * const solutionJSON = JSON.stringify(solutionInstance)
	 * const newSolutionInstance = Solution.from(solutionJSON)
	 */
	static fromString(solutionLike: string) {
		try {
			const initSolution = JSON.parse(solutionLike)
			return new SolutionService(new GridService(initSolution))
		} catch (err) {
			throw new InvalidSolutionError(solutionLike, err)
		}
	}

	/**
	 * Check if a Sudoku cell is safe to place a number.
	 * @param {SolutionGrid} value The current Sudoku grid.
	 * @param {number} num The number to check.
	 * @param {Position} position The position of the cell to check.
	 * @private
	 */
	static #cellIsSafe(value: number[][], num: number, { row, col }: Position) {
		if (value[row][col] !== 0) return false

		for (let i = 0; i < 9; i++) {
			if (value[row][i] === num) return false
			if (value[i][col] === num) return false
			if (value[box.row(i, row)][box.col(i, col)] === num) return false
		}

		return true
	}

	/** Create a Sudoku solution data. */
	static #fillSolution() {
		let value = createMatrix(9, () => 0)
		for (let i = 0; i < 9; i++) {
			const retry = () => {
				value = createMatrix(9, () => 0)
				i = -1
			}
			for (let j = i; j < 9; j++) {
				const numbers = randomNumbers()
				for (const num of numbers) if (this.#cellIsSafe(value, num, { row: i, col: j })) value[i][j] = num

				for (const num of numbers.reverse()) if (this.#cellIsSafe(value, num, { row: j, col: i })) value[j][i] = num

				if (value[i][j] === 0 || value[j][i] === 0) {
					retry()
					break
				}
			}
		}
		return new GridService(value as ValidNumbers[][])
	}

	toJSON(): SolutionJSON {
		return this.#grid.value
	}

	toString() {
		const col = ' | '
		const row = '\n- - - + - - - + - - -\n'
		return this.grid.joinGrid({ col, row })
	}
}

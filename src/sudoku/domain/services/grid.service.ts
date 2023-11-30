import type { Pos } from '~/share/domain/models'
import { PosSvc } from '~/share/domain/services'
import type { Tuple } from '~/share/types'
import { createArray, createMatrix, iterateArray, iterateMatrix } from '~/share/utils'

import { type CBFn, type CompareCBFn, type CreateCBFn, type Grid, type IGrid } from '../models'

/** Represent a Sudoku Grid Service. */
export class GridSvc<T> implements IGrid<T> {
	readonly #data

	/**
	 * Creates an instance of the GridSvc class with the provided data.
	 * @param data A two-dimensional array representing the Sudoku grid.
	 * @throws {Error} If the data is invalid (not a 9x9 grid).
	 */
	constructor(data: Grid<T>) {
		this.#data = data
	}

	get data() {
		return this.#mapData(cell => cell)
	}

	/**
	 * Creates an instance of the GridSvc with map function.
	 * @param mapFn A mapping function to call on every element of the array.
	 */
	static create<T>(mapFn: CreateCBFn<T>) {
		return new GridSvc(createMatrix(9, mapFn))
	}

	compareRelated(cellPos: Pos, fn: CompareCBFn<T, boolean>) {
		for (const currPos of iterateMatrix(9)) {
			if (PosSvc.areRelated(cellPos, currPos) && !fn(this.getCell(cellPos), this.getCell(currPos), currPos))
				return false
		}

		return true
	}

	compareWithBox(cellPos: Pos, fn: CompareCBFn<T, boolean>) {
		const box = PosSvc.getInitsBox(cellPos)
		for (const pos of iterateMatrix(3)) {
			const currPos = PosSvc.sumPos(pos, box)
			if (!PosSvc.equalsPos(cellPos, currPos) && !fn(this.getCell(cellPos), this.getCell(currPos), currPos))
				return false
		}

		return true
	}

	compareWithCol(cellPos: Pos, fn: CompareCBFn<T, boolean>) {
		const { x } = cellPos
		for (const y of iterateArray(9))
			if (y !== cellPos.y && !fn(this.getCell(cellPos), this.getCell({ y, x }), { y, x })) return false
		return true
	}

	compareWithRow(cellPos: Pos, fn: CompareCBFn<T, boolean>) {
		const { y } = cellPos
		for (const x of iterateArray(9))
			if (x !== cellPos.x && !fn(this.getCell(cellPos), this.getCell({ y, x }), { y, x })) return false
		return true
	}

	copy() {
		return new GridSvc(this.data)
	}

	count(fnCond: CBFn<T, boolean>) {
		let asserts = 0
		for (const pos of iterateMatrix(9)) if (fnCond(this.getCell(pos), pos)) asserts++

		return asserts
	}

	editCell<U>(cellPos: Pos, fn: CBFn<T, U>) {
		const newGrid = this.#mapData((cell, pos) =>
			PosSvc.equalsPos(cellPos, pos) ? fn(this.getCell(cellPos), cellPos) : cell
		)

		return new GridSvc(newGrid)
	}

	everyBox(box: number, fn: CBFn<T, boolean>) {
		const boxPos = PosSvc.getPosFromBox(box)
		for (const pos of iterateMatrix(3)) {
			const currPos = PosSvc.sumPos(boxPos, pos)
			if (!fn(this.getCell(currPos), currPos)) return false
		}

		return true
	}

	everyCol(x: number, fn: CBFn<T, boolean>) {
		for (const y of iterateArray(9)) if (!fn(this.getCell({ y, x }), { y, x })) return false
		return true
	}

	everyGrid(fn: CBFn<T, boolean>) {
		return this.#data.every((row, y) => row.every((cell, x) => fn(cell, { y, x })))
	}

	everyRow(y: number, fn: CBFn<T, boolean>) {
		return this.#data[y].every((cell, x) => fn(cell, { y, x }))
	}

	getCell(pos: Pos): T
	getCell({ y, x }: Pos) {
		return this.#data[y][x]
	}

	groupSubgrids<U>(fn: CBFn<T, U>) {
		const newGrid = {} as {
			[K in keyof U]: GridSvc<U[K]>
		}

		for (const pos of iterateMatrix(9)) {
			const result = fn(this.getCell(pos), pos)

			for (const key of Object.keys(result)) {
				if (!(key in newGrid)) newGrid[key] = new GridSvc(createArray(9, () => Array(9) as Tuple<U[keyof U], 9>))
				newGrid[key].#mutateCell(pos, result[key])
			}
		}

		return newGrid
	}

	joinBox(box: number, separators: { x?: string; y?: string }): string
	joinBox(box: number, { y: rowSep = '', x: colSep = '' }: { x?: string; y?: string }) {
		let str = ''
		const boxPos = PosSvc.getPosFromBox(box)
		for (const pos of iterateMatrix(3)) {
			const { y, x } = PosSvc.sumPos(pos, boxPos)
			if (pos.y === 0 && pos.x === 0) str += this.#data[y][x]
			else if (pos.x === 0) str += colSep + this.#data[y][x]
			else str += rowSep + this.#data[y][x]
		}

		return str
	}

	joinCol(x: number, rowSeparator: string) {
		let str = ''

		for (const y of iterateArray(9))
			if (y === 0) str += this.#data[y][x]
			else str += rowSeparator + this.#data[y][x]

		return str
	}

	joinGrid(separators: { x?: string; y?: string }): string
	joinGrid({ x = '', y = '' }: { x?: string; y?: string }) {
		return this.#data.map(Row => Row.join(y)).join(x)
	}

	joinRow(rowIndex: number, colSeparator: string) {
		return this.#data[rowIndex].join(colSeparator)
	}

	mapBox<U>(box: number, fn: CBFn<T, U>) {
		const newData = this.#mapData(this.#condMap(curr => PosSvc.getBoxFromPos(curr) === box, fn))

		return new GridSvc(newData)
	}

	mapCol<U>(x: number, fn: CBFn<T, U>) {
		const newData = this.#mapData(this.#condMap(curr => curr.x === x, fn))
		return new GridSvc(newData)
	}

	mapFiltered<U, S extends T>(filter: (cell: T, pos: Pos) => cell is S, map: CBFn<S, U>) {
		const newData = this.#mapData((cell, currPos) => (filter(cell, currPos) ? map(cell, currPos) : cell))

		return new GridSvc(newData)
	}

	mapGrid<U>(fn: CBFn<T, U>) {
		return new GridSvc(this.#mapData(fn))
	}

	mapRelated<U>(cellPos: Pos, fn: CBFn<T, U>) {
		const newData = this.#mapData(
			this.#condMap(curr => !PosSvc.equalsPos(cellPos, curr) && PosSvc.areRelated(cellPos, curr), fn)
		)

		return new GridSvc(newData)
	}

	mapRow<U>(y: number, fn: CBFn<T, U>) {
		const newData = this.#mapData(this.#condMap(curr => curr.y === y, fn))

		return new GridSvc(newData)
	}

	someBox(box: number, fn: CBFn<T, boolean>) {
		const boxPos = PosSvc.getPosFromBox(box)
		for (const pos of iterateMatrix(3)) {
			const { y, x } = PosSvc.sumPos(boxPos, pos)
			if (fn(this.#data[y][x], { y, x })) return true
		}

		return false
	}

	someCol(x: number, fn: CBFn<T, boolean>) {
		for (const y of iterateArray(9)) if (fn(this.getCell({ y, x }), { y, x })) return true
		return false
	}

	someGrid(fn: CBFn<T, boolean>): boolean {
		return this.#data.some((row, y) => row.some((cell, x) => fn(cell, { y, x })))
	}

	someRow(y: number, fn: CBFn<T, boolean>): boolean {
		return this.#data[y].some((cell, x) => fn(cell, { y, x }))
	}

	/**
	 * Returns another function that transforms the given value if the condition is met; otherwise, it returns the value unchanged.
	 * @param cond The conditional function, if true, will execute the mapping function; if false, nothing will be done.
	 * @param map The mapping function only executes if the condition is true.
	 * @returns A function that runs the mapping function only if the condition is met; otherwise, it does nothing.
	 */
	#condMap<T, U>(cond: (curr: Pos) => boolean, map: CBFn<T, U>): CBFn<T, T | U> {
		return (cell, pos) => (cond(pos) ? map(cell, pos) : cell)
	}

	/**
	 * Map each of the cells in the data.
	 * @param mapFn The mapping function.
	 * @returns The mapped data.
	 */
	#mapData<U>(mapFn: CBFn<T, U>) {
		return this.#data.map((row, y) => row.map((cell, x) => mapFn(cell, { y, x }))) as Grid<U>
	}

	/**
	 * Change the content of the specific cell.
	 * @param pos Position of cell to be mutate.
	 * @param newCell The new Cell content.
	 */
	#mutateCell(pos: Pos, newCell: T): void
	#mutateCell({ y, x }: Pos, newCell: T) {
		this.#data[y][x] = newCell
	}
}

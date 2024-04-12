import { type Pos } from '~/share/domain/entities'
import type { OptionalKeys } from '~/share/types'
import type { Lang } from '$i18n/domain/const'
import type { Prefs, ToggleNames } from '$pref/domain/models'
import { Modal, RouteBase } from '$screen/domain/entities'
import { GET_DIFFICULTY_NAME, type ModeKind } from '$sudoku/domain/const'
import { Solution, type ValidNumbers } from '$sudoku/domain/entities'
import { type SudokuSetts } from '$sudoku/domain/models'

import type { ActionUnData, ActionWithData, DataAction } from '../models'

// i18n Actions.
const changeLang: ActionWithData<{ lang: Lang }> = async ({ i18n, screen }, { lang }) => {
	await Promise.all([screen.setLang(lang).save(), i18n.setLang(lang).save()])
}

export const I18N_ACTIONS = { changeLang }

// Pref actions.
interface SetPrefByKey<K extends keyof Prefs = keyof Prefs> {
	key: K
	type: 'by-key'
	value: Prefs[K]
}

type SetPrefData = { prefs: Prefs; type: 'all' } | SetPrefByKey

const setPref: ActionWithData<SetPrefData & DataAction> = async ({ i18n, prefs, screen }, data) => {
	if (data.type === 'all') await prefs.setAll(data.prefs).save()
	else await prefs.setByKey(data.key, data.value).save()
}

type ResetPrefData = { type: 'all' } | { key: keyof Prefs; type: 'by-key' }

const resetPref: ActionWithData<ResetPrefData> = async ({ i18n, prefs, screen }, data) => {
	if (data.type === 'all') await prefs.resetAll().save()
	else await prefs.resetByKey(data.key).save()
}

const invertPref: ActionWithData<{ pref: ToggleNames }> = async ({ prefs }, data) =>
	await prefs.setByKey(data.pref, !prefs.data[data.pref]).save()

export const PREFS_ACTIONS = { set: setPref, reset: resetPref, invert: invertPref }

// Screen Actions.
const closeScreen: ActionUnData = async ({ i18n, screen, sudoku }) => {
	const isGameRoute = RouteBase.isGame(screen.data.route)
	const isNoneDialog = Modal.isNone(screen.data.modal)
	if (isGameRoute && isNoneDialog && !sudoku.isASaved) {
		screen.setModal(Modal.createWarn('unsave'))
		return
	}

	await screen.close().save()
	await i18n.setRoute(screen.data.route).save()

	if (isGameRoute && !isNoneDialog) sudoku.continue()
	else await sudoku.end()
}

const openModal: ActionWithData<{ modal: Modal }> = async ({ screen }, data) => {
	screen.setModal(data.modal)
}

const goTo: ActionWithData<{ route: RouteBase }> = async ({ i18n, screen, sudoku }, { route }) => {
	if (!RouteBase.isGame(screen.data.route) && RouteBase.isGame(route) && !sudoku.isASaved) {
		screen.setModal(Modal.createWarn('unsave'))
		return
	}

	await Promise.all([screen.setRoute(route).save(), i18n.setRoute(route).save()])
}

export const SCREEN_ACTIONS = { close: closeScreen, openModal, goTo }

// Sudoku actions.
const clearCell: ActionUnData = async ({ sudoku }) => {
	sudoku.clear()
}

const writeCell: ActionWithData<{ value: ValidNumbers | 0 }> = async (state, data) => {
	if (data.value === 0) return await clearCell(state)

	const { autoNoteDeletion: removeNotes, autoValidation: validate } = state.prefs.data
	state.sudoku.write(data.value, { removeNotes, validate })

	if (state.sudoku.hasWin) state.screen.setModal(Modal.createWin())
}

const verifyBoard: ActionUnData = async ({ sudoku }) => {
	sudoku.verify()
}

interface MoveDir {
	times: number
	type: 'Down' | 'Left' | 'Right' | 'Up'
}
interface MoveSet {
	pos: Pos
	type: 'set'
}

type MoveSelectionData = MoveDir | MoveSet

const moveSelection: ActionWithData<MoveSelectionData & DataAction> = async ({ sudoku }, data) => {
	if (data.type === 'set') sudoku.moveTo(data.pos)
	else sudoku.move(data.type, data.times)
}

const changeMode: ActionWithData<{ mode: ModeKind }> = async ({ sudoku }, data) => {
	sudoku.changeMode(data.mode)
}

const redoGame: ActionUnData = async ({ sudoku }) => {
	sudoku.redo()
}
const undoGame: ActionUnData = async ({ sudoku }) => {
	sudoku.undo()
}

const sudokuEnd: ActionUnData = async ({ sudoku }) => await sudoku.end()

const sudokuResume: ActionUnData = async ({ prefs, screen, sudoku }) => {
	if (sudoku.isASaved && !RouteBase.isGame(screen.data.route)) {
		sudoku.resume(prefs.data.timer)
		await screen.setRoute(RouteBase.createGame(GET_DIFFICULTY_NAME[sudoku.setts!.difficulty])).save()
	} else sudoku.continue()
}

const sudokuSave: ActionUnData = async ({ sudoku }) => await sudoku.save()

const sudokuStart: ActionWithData<OptionalKeys<SudokuSetts, 'solution'> & DataAction> = async (
	{ prefs, screen, sudoku },
	{ difficulty, solution = Solution.create() }
) => {
	await Promise.all([
		sudoku.start({ difficulty, solution }, prefs.data.timer).save(),
		screen.setRoute(RouteBase.createGame(GET_DIFFICULTY_NAME[difficulty])).save(),
	])
}

export const SUDOKU_ACTIONS = {
	clear: clearCell,
	write: writeCell,
	verify: verifyBoard,
	move: moveSelection,
	changeMode,
	redo: redoGame,
	undo: undoGame,
	end: sudokuEnd,
	resume: sudokuResume,
	save: sudokuSave,
	start: sudokuStart,
}

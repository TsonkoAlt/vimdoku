import { type BrowserStorage, LocalStorageEntryMissingError } from '~/share/utils'
import { type AllPreferences } from '$preferences/domain/models'
import type { PreferencesRepo } from '$preferences/domain/repositories'
import { PreferencesService } from '$preferences/domain/services'

export class BrowserPreferencesRepo implements PreferencesRepo {
	#name
	#storage: BrowserStorage
	#value: PreferencesService | null = null

	constructor(name = 'preferences') {
		this.#storage = {
			del() {
				localStorage.removeItem(name)
			},
			get: () => localStorage.getItem(name),
			set(value) {
				localStorage.setItem(name, value)
			},
		}
		this.#name = name
	}

	async create() {
		const preferences = PreferencesService.create()

		this.#value = preferences
		this.#storage.set(preferences.toString())
	}

	async delete() {
		this.#value = null
		this.#storage.del()
	}

	async getPreferences() {
		if (this.#value != null) return this.#value

		const data = this.#storage.get()

		if (data == null) return null

		this.#value = PreferencesService.fromString(data)

		return this.#value
	}

	async has() {
		return this.#value != null || this.#storage.get() != null
	}

	async setPreference<K extends keyof AllPreferences>(key: K, value: AllPreferences[K]) {
		if (this.#value == null) {
			const data = this.#storage.get()

			if (data == null) throw new LocalStorageEntryMissingError(this.#name)

			this.#value = PreferencesService.fromString(data)
		}
		this.#value.set(key, value)

		this.#storage.set(this.#value.toString())
	}
}

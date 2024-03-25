import type { GameLocale, HomeLocale, ShareLocale } from '~/locales'
import { inArray, inject } from '~/share/utils'

import { type Lang, LANGS } from '../const'
import { IDLE_I18N } from '../entities'
import { type II18n } from '../models'
import type { I18nRepo } from '../repositories/i18n.repo'
import { I18nObs } from './i18n-obs.service'

export class I18nSvc implements II18n {
	readonly #obs = inject(I18nObs)
	readonly #repo

	constructor(repo: I18nRepo) {
		this.#repo = repo
	}

	get data() {
		return this.#obs.data
	}

	async changeLang(lang: Lang): Promise<void> {
		if (!inArray(LANGS, lang)) {
			this.#obs.set(IDLE_I18N)
			return
		}

		const namespace = await this.#repo.getLocale(lang)

		this.#obs.set({
			lang,
			ns: localeKey => {
				const locale = namespace[localeKey]

				if (locale == null) throw new Error(`Not exist "${localeKey}" in "${lang}"`)

				return new Proxy(
					{},
					{
						get(_, prop) {
							if (prop in locale)
								return (fallback: string, keywords?: Record<string, string>) => {
									let text = locale[prop as keyof typeof locale] as string
									if (keywords != null)
										for (const [keyword, value] of Object.entries(keywords))
											text = text.replaceAll(`{|${keyword}|}`, value)
									return text
								}
						},
					}
				) as never
			},
		})
	}

	async load(): Promise<void> {
		const lang = await this.#repo.getLang()
		if (lang != null) await this.changeLang(lang)
	}
}

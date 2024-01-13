import { Observable } from '~/share/domain/entities'
import { singleton } from '~/share/utils'

import { type I18n, IDLE_I18N } from '../models'

@singleton
export class I18nObs extends Observable<I18n> {
	constructor() {
		super({ ...IDLE_I18N })
	}
}

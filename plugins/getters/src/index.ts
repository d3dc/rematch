import { Store, Model, Models, Plugin } from '@rematch/core'
// import { STORE_NAME_KEY } from '@rematch/storeName'
// TODO: FIXME
const STORE_NAME_KEY = '@@rematchStoreName'

import sliceStateFactory from './sliceStateFactory'
import subscribable from './subscribable'

export const getters = {}
const storeGetters = {}

export function gettersFor(state: any, refKey: string? = STORE_NAME_KEY) {
	return storeGetters[state[refKey]]
}

export function get (mapGettersToProps: Function, refKey: string?) {
	return (state, ...args) =>
		mapGettersToProps(
			gettersFor(state, refKey),
			...args
		)
}

export interface GettersConfig {}

const createGettersPlugin = (config: GettersConfig = {}): Plugin => {
	const localGetters = {}
	const factory = subscribable()

  return {
		onInit() {
			this.validate([
				[
					!this.storeNameKey,
					'getters plugin requires the storeName plugin'
				],
				[
					!this.selector,
					'getters plugin requires the select plugin'
				],
			])
		},
    onModel(model: Model) {
			localGetters[model.name] = {}

      const modelGetters =
        typeof model.getters === "function"
          ? model.getters(localGetters)
          : model.getters

     	Object.keys(modelGetters || {}).forEach((getterName: String) => {
				this.validate([
				  [
				    typeof modelGetters[getterName] !== "function",
				    `Getters (${getterPath}) must be a function`
				  ]
				])

				localGetters[model.name][getterName] = (...args) =>
					getters[model.name][getterName](this.storeGetState(), ...args)

				factory.onReady((createSliceState) => {
					const sliceState = createSliceState(
						model,
						getterName,
						modelGetters[getterName]
					)

					getters[model.name][getterName] = this.selector(
						sliceState,
						(state: any) => modelGetters[getterName].call(
							gettersFor(state, this.storeNameKey)[model.name],
							state
						)
					)
				})
			})
    },
		onStoreCreated(store: Store) {
			storeGetters[store.name || 'fixme'] = localGetters
			factory.ready(sliceStateFactory(
				getters,
				this.sliceState,
				this.storeGetState
			))
		}
  }
}

export default createGettersPlugin

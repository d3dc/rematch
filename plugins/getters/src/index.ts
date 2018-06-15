import { Store, Model, Models, Plugin } from '@rematch/core'

export const GETTERS_REF_KEY = '@@gettersRef'

export const getters = {}
const storeGetters = {}

export function gettersFor(state: any, refKey: string? = GETTERS_REF_KEY) {
	return storeGetters[state[refKey]]
}

export function get (mapGettersToProps: Function, refKey: string?) {
	return (state, ...args) =>
		mapGettersToProps(
			gettersFor(state, refKey),
			...args
		)
}

export interface GettersConfig {
	name?: string,
	sliceState?: any,
}

const validateConfig = (config) => {
	if (config.name && typeof config.name !== 'string') {
		throw new Error('getters plugin config name must be a string')
	}
  if (config.sliceState && typeof config.sliceState !== 'function') {
    throw new Error('getters plugin config sliceState must be a function')
  }
}

const createGettersPlugin = (config: GettersConfig = {}): Plugin => {
  validateConfig(config)

  const sliceState = config.sliceState || ((rootState, model) => rootState[model.name])

	const localGetters = {}

	const refKey = config.name || GETTERS_REF_KEY

  return {
		expose: {
			getters
		}
    onModel(model: Model) {
			getters[model.name] = {}
			localGetters[model.name] = {}

      const modelGetters =
        typeof model.getters === "function"
          ? model.getters(localGetters)
          : model.getters

     	Object.keys(modelGetters || {}).forEach((getterName: String) => {
				this.validate([
				  [
				    typeof modelGetters[getterName] !== "function",
				    `Gettersor (${model.name}/${getterName}) must be a function`
				  ]
				])

				getters[model.name][getterName] = (state, ...args) =>
					modelGetters[getterName].call(
						gettersFor(state, refKey)[model.name],
						sliceState(state, model),
						...args
					)

				localGetters[model.name][getterName] = (...args) =>
					getters[model.name][getterName](this.storeGetState(), ...args)
			})
    },
		onStoreCreated(store: Store) {
			const ref = store.name || 'fixme'
			storeGetters[ref] = localGetters
			store.model({
				name: refKey,
				state: ref
			})
		}
  }
}

export default createGettersPlugin

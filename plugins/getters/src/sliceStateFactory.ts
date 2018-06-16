import { Model } from '@rematch/core'

// Create a shallow clone of an object that registers deps
function mockState (state, onDep) {
  if (typeof state !== 'object') {
    onDep()
    return state
  }

  return Object.keys(state).reduce((acc, key) => ({
      ...acc,
      get [key] () => {
        onDep(key)
        return state[key]
      }
    }), {})
}

function backup(obj) {
	const original = { ...obj }
	return () => {
		Object.keys(obj).forEach((key) => {
			obj[key] = original[key]
		})
	}
}

// Replace already bound getters with mocks and then reset
function withMockGetters (getters, onDep, next) {
  const reset = backup(getters)
  for (const modelName of Object.keys(getters)) {
    const original = getters[modelName]
    getters[modelName] = Object.keys(original).reduce((acc, key) => ({
      ...acc,
      [key]: () => {
        onDep([modelName, key])
        return original[key]()
      }
    }), {})
  }
  next()
  reset()
}

function sliceStateFactory(
  getters: any,
  sliceState: Function,
  getState: Function
) {
  // The factory tracks dependencies
  const deps = {}

  // Gets a list of all state leafs
  const sliceDeps = (modelKey, getterKey) =>
    deps[`${modelKey}/${getterKey}`].reduce((rest, dep) => [
      ...rest,
      dep,
      ...sliceDeps(dep[0], dep[1])
    ], [])

  return function(model: Model, getterKey: string, compute: Function) {
    const key = `${model.name}/${getterKey}`
    deps[key] = []

    const mockedState = mockState(
      sliceState(getState(), model),
      (stateKey) => deps[key].push([model.name, stateKey])
    )

    withMockGetters(
      getters,
      (dep) => deps[key].push(dep),
      () => compute(mockedState)
    )

    return (state) => {
      return sliceDeps(model.name, getterKey).reduce((acc, dep) =>
        (state) => {
          if (dep[1] === undefined) {
            return state[dep[0]]
          } else {
            return state[dep[0], dep[1]]
          }
        }
      }, [])
    }
  }
}

export default sliceStateFactory

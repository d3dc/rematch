import { Model } from '@rematch/core'

// Create a clone of state that registers deps
function mockState (state, onDep) {
  return Object.keys(state).reduce((acc, key) => ({
    ...acc,
    get [key] () => {
      onDep(key)
      return state[key]
    }
  }))
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
    }))
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
  let currentDeps

  // Gets a list of all state leafs
  const sliceDeps = (modelKey, getterKey) =>
    deps[`${modelKey}/${getterKey}`].reduce((rest, dep) => [
      ...rest,
      dep,
      ...sliceDeps(dep[0], dep[1])
    ], [])

  return function(model: Model, getterKey: string, compute: Function) {
    const key = `${model.name}/${getterKey}`
    const mockedState = mockState(
      sliceState(getState(), model),
      (stateKey) => deps[key].push([model.name, stateKey])
    )

    currentDeps = []
    withMockGetters(
      getters,
      (dep) => deps[key].push(dep)
      () => compute(mockedState)
    )
    deps[key] = currentDeps

    return (state) => {
      return sliceDeps(model.name, getterKey).reduce((acc, dep) => {
        if (!acc[dep[0]]) {
          acc[dep[0]] = {}
        }

        acc[dep[0]][dep[1]] = state[dep[0], dep[1]]

        return acc
      }, {})
    }
  }
}

export default sliceStateFactory

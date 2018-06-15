const { default: createGettersPlugin, getters, get, gettersFor, GETTERS_REF_KEY } = require('../src')
const { init } = require('../../../src')

describe('getters:', () => {
  it('should allow access to the getter', () => {
    const a = {
      state: 2,
      reducers: {
        increment: s => s + 1
      },
      getters: {
        double: s => s * 2
      }
    }
    const store = init({
      models: { a },
      plugins: [createGettersPlugin()]
    })
    const state = store.getState()
    const doubled = getters.a.double(state)
    expect(doubled).toBe(4)
  })

  it('should create a valid local getter', () => {
    const a = {
      state: 2,
      reducers: {
        increment: s => s + 1
      },
      getters: {
        double: s => s * 2
      }
    }
    const store = init({
      models: { a },
      plugins: [createGettersPlugin()]
    })
    const state = store.getState()
    const getters = gettersFor(state)
    expect(typeof getters.a.double).toBe('function')
    expect(getters.a.double()).toBe(4)
  })

  it('should allow passing in of params togetter', () => {
    const a = {
      state: 2,
      reducers: {
        increment: s => s + 1
      },
      getters: {
        prependWithLetter: (s, letter) => letter + s
      }
    }
    const store = init({
      models: { a },
      plugins: [createGettersPlugin()]
    })
    const state = store.getState()
    const prepended = getters.a.prependWithLetter(state, 'P')
    expect(prepended).toBe('P2')
  })

  it('should create a valid local getter', () => {
    const a = {
      state: 2,
      reducers: {
        increment: s => s + 1
      },
      getters: {
        double: s => s * 2
      }
    }
    const store = init({
      models: { a },
      plugins: [createGettersPlugin()]
    })
    const state = store.getState()
    const getters = gettersFor(state)
    expect(typeof getters.a.double).toBe('function')
    expect(getters.a.double()).toBe(4)
  })

  test('should throw if getter is not a function', () => {
    const store = init({
      plugins: [createGettersPlugin()]
    })
    expect(() => store.model({
      name: 'a',
      state: 2,
      getters: {
        invalid: 42
      }
    })).toThrow()
  })

  test('should not throw if no getters', () => {
    const a = {
      state: 2,
      reducers: {
        increment: s => s + 1
      }
    }
    const start = () => init({
      models: { a },
      plugins: [createGettersPlugin()]
    })
    expect(start).not.toThrow()
  })

  describe('get: ', () => {
    it('should map a state', () => {
      const a = {
        state: 2,
        reducers: {
          increment: s => s + 1
        },
        getters: {
          double: s => s * 2
        }
      }
      const store = init({
        models: { a },
        plugins: [createGettersPlugin()]
      })
      const state = store.getState()
      const connect = (mapState) => mapState(state)
      const props = connect(get(getters => ({
        double: getters.a.double()
      })))
      expect(props.double).toBe(4)
    })
  })

  describe('local getters: ', () => {
    it('should allow access to the same model getters', () => {
      const a = {
        state: 2,
        reducers: {
          increment: s => s + 1
        },
        getters: {
          double: s => s * 2,
          quadruple (s) {
            return this.double() * 2
          }
        }
      }
      const store = init({
        models: { a },
        plugins: [createGettersPlugin()]
      })
      const state = store.getState()
      const doubled = getters.a.double(state)
      const quadrupled = getters.a.quadruple(state)
      expect(doubled).toBe(4)
      expect(quadrupled).toBe(8)
    })

    it('should allow access to store getters', () => {
      const a = {
        state: 2,
        reducers: {
          increment: s => s + 1
        },
        getters: (get) => ({
          double: s => s * 2,
          quadruple (s) {
            return get.a.double() * 2
          }
        })
      }
      const store = init({
        models: { a },
        plugins: [createGettersPlugin()]
      })
      const state = store.getState()
      const doubled = getters.a.double(state)
      const quadrupled = getters.a.quadruple(state)
      expect(doubled).toBe(4)
      expect(quadrupled).toBe(8)
    })

    it('should curry store state', () => {
      const a = {
        state: 2,
        reducers: {
          increment: s => s + 1
        },
        getters: {
          double: s => s * 2,
          curriedDouble (s) {
            return this.double(42)
          }
        }
      }
      const store = init({
        models: { a },
        plugins: [createGettersPlugin()]
      })
      const state = store.getState()
      const doubled = getters.a.curriedDouble(state)
      expect(doubled).toBe(4)
    })
  })

  describe('store ref: ', () => {
    test('should throw if name config is not a string', () => {
      const createGettersPlugin = require('../src').default
      const { init } = require('../../../src')

      const start = () => {
        init({ plugins: [ createGettersPlugin({ name: (error) => error }) ] })
      }

      expect(start).toThrow()
    })

    it('should expose the store name', async () => {
      const store = init({
        plugins: [createGettersPlugin()]
      })

      const state = store.getState()
      expect(state).toEqual({
        [GETTERS_REF_KEY]: store.name
      })
    })

    it('should expose the store name with a configured key', async () => {
      const store = init({
        plugins: [createGettersPlugin({
          name: 'chicken'
        })]
      })

      const state = store.getState()
      expect(state).toEqual({
        'chicken': store.name
      })
    })
  })

  describe('sliceState config: ', () => {
    test('should throw if sliceState config is not a function', () => {
      const createGettersPlugin = require('../src').default
      const { init } = require('../../../src')

      const start = () => {
        init({ plugins: [ createGettersPlugin({ sliceState: 'error' }) ] })
      }

      expect(start).toThrow()
    })

    it('should allow access to the global state with a property configured sliceState method', () => {
      const createGettersPlugin = require('../src').default
      const { getters } = require('../src')
      const { init } = require('../../../src')

      const countA = {
        state: 2,
        getters: {
          double: state => state.countB * 2
        }
      }
      const countB = {
        state: 10,
        getters: {
          double: state => state.countA * 2
        }
      }

      const store = init({
        models: { countA, countB },
        plugins: [createGettersPlugin({ sliceState: (rootState) => rootState })]
      })

      const state = store.getState()
      const result = getters.countB.double(state)
      expect(result).toBe(4)
    })
  })
})

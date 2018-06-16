const { default: createGettersPlugin, getters, get, gettersFor } = require('../src')
const createSelectPlugin = require('../../select/src').default
const createStoreNamePlugin = require('../../storeName/src').default
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
      plugins: [
        createStoreNamePlugin(),
        createSelectPlugin(),
        createGettersPlugin()
      ]
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
      plugins: [
        createStoreNamePlugin(),
        createSelectPlugin(),
        createGettersPlugin()
      ]
    })
    const state = store.getState()
    const getters = gettersFor(state)
    expect(typeof getters.a.double).toBe('function')
    expect(getters.a.double()).toBe(4)
  })

  test('should throw if getter is not a function', () => {
    const store = init({
      plugins: [
        createStoreNamePlugin(),
        createSelectPlugin(),
        createGettersPlugin()
      ]
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
      plugins: [
        createStoreNamePlugin(),
        createSelectPlugin(),
        createGettersPlugin()
      ]
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
        plugins: [
          createStoreNamePlugin(),
          createSelectPlugin(),
          createGettersPlugin()
        ]
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
        plugins: [
          createStoreNamePlugin(),
          createSelectPlugin(),
          createGettersPlugin()
        ]
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
        plugins: [
          createStoreNamePlugin(),
          createSelectPlugin(),
          createGettersPlugin()
        ]
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
        plugins: [
          createStoreNamePlugin(),
          createSelectPlugin(),
          createGettersPlugin()
        ]
      })
      const state = store.getState()
      const doubled = getters.a.curriedDouble(state)
      expect(doubled).toBe(4)
    })
  })

  describe('slice dependencies: ', () => {
    it('should update getters after dependencies update', () => {
      const a = {
        state: 2,
        reducers: {
          increment: s => s + 1
        },
        getters: {
          double: s => s * 2
        }
      }
      const b = {
        state: 2,
        getters: (get) => ({
          quadruple: s => get.a.double() * 2
        })
      }
      const store = init({
        models: { a, b },
        plugins: [
          createStoreNamePlugin(),
          createSelectPlugin(),
          createGettersPlugin()
        ]
      })
      const state = store.getState()
      const double = getters.a.double(state)
      const first = getters.b.quadruple(state)
      store.dispatch.a.increment()
      const second = getters.b.quadruple(state)
      expect(double).toBe(4)
      expect(first).toBe(8)
      expect(second).toBe(12)
    })
  })
})

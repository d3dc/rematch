import { PluginCreator } from '../typings'
import validate from './validate'

export default (plugins: PluginCreator[]) => plugins.reduce((exposed: any, plugin: PluginCreator) => ({
  ...exposed,
  ...(plugin.expose || {}),
}), {
  validate,
})

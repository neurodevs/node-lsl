import LslEventMarkerEmitter from '../impl/LslEventMarkerEmitter.js'

const emitter = await LslEventMarkerEmitter.Create()

emitter.destroy()

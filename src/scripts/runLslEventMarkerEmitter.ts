import LslEventMarkerEmitter from '../impl/LslEventMarkerEmitter.js'

const outlet = await LslEventMarkerEmitter.Create()

const markers = [
    { name: 'phase-1-begin', waitAfterMs: 100 },
    { name: 'phase-1-end', waitAfterMs: 100 },
    { name: 'never-reached-marker', waitAfterMs: 100 },
]

void outlet.emitMany(markers)

await new Promise((resolve) => setTimeout(resolve, 250))

outlet.interrupt()

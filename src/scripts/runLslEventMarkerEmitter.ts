import LslEventMarkerEmitter from '../impl/LslEventMarkerEmitter.js'

const outlet = await LslEventMarkerEmitter.Create()

const markers = [
    { name: 'phase-1-begin', waitForMs: 100 },
    { name: 'phase-1-end', waitForMs: 100 },
    { name: 'never-reached-marker', waitForMs: 100 },
]

void outlet.emitMany(markers)

await new Promise((resolve) => setTimeout(resolve, 250))

outlet.interrupt()

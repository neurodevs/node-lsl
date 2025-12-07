import LslStreamInlet from '../impl/LslStreamInlet.js'
import LslStreamOutlet from '../impl/LslStreamOutlet.js'

console.log('Creating outlet...')
const outlet = await LslStreamOutlet.Create({
    name: 'TestOutlet',
    type: 'TEST',
    sourceId: 'TestOutletID',
    sampleRateHz: 100,
    channelNames: ['Ch1', 'Ch2', 'Ch3'],
    channelFormat: 'float32',
    chunkSize: 1,
    units: 'test',
    manufacturer: 'test',
})

console.log('Creating inlet...')

const inletOptions = {
    info: outlet.info,
    chunkSize: 1,
}

const inlet = await LslStreamInlet.Create(
    inletOptions,
    (samples, timestamps) => {
        console.log('Received samples:', samples, 'at timestamps:', timestamps)
    }
)

console.log('Start pulling...')
inlet.startPulling()

console.log('Waiting for 100 ms...')
await new Promise((resolve) => setTimeout(resolve, 100))

console.log('Pushing samples...')
for (let i = 0; i < 300; i++) {
    const sample = [i, i, i]
    outlet.pushSample(sample)
    await new Promise((resolve) => setTimeout(resolve, 10))
}

await new Promise((resolve) => setTimeout(resolve, 1000))

console.log('Pushing more samples...')
for (let i = 0; i < 30; i++) {
    const sample = [i, i, i]
    outlet.pushSample(sample)
    await new Promise((resolve) => setTimeout(resolve, 100))
}

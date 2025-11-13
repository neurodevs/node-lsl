import LslStreamInlet from '../impl/LslStreamInlet.js'
import LslStreamOutlet from '../impl/LslStreamOutlet.js'

const outlet = await LslStreamOutlet.Create({
    name: 'TestOutlet',
    channelNames: ['Ch1', 'Ch2', 'Ch3'],
    sampleRate: 100,
    channelFormat: 'float32',
    sourceId: 'TestOutletID',
    chunkSize: 1,
    maxBuffered: 360,
    type: 'TEST',
    unit: 'test',
    manufacturer: 'test',
})

const inlet = LslStreamInlet.Create({
    name: 'TestOutlet',
    type: 'TEST',
    sourceId: 'TestOutletID',
    channelNames: ['Ch1', 'Ch2', 'Ch3'],
    sampleRate: 100,
    channelFormat: 'float32',
    chunkSize: 1,
    maxBuffered: 360,
    onChunk: (samples, timestamps) => {
        console.log('Received samples:', samples, 'at timestamps:', timestamps)
    },
})

inlet.startPulling()

await new Promise((resolve) => setTimeout(resolve, 100))

for (let i = 0; i < 1000; i++) {
    const sample = [i, i, i]
    outlet.pushSample(sample)
    await new Promise((resolve) => setTimeout(resolve, 10))
}

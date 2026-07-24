import LslStreamOutlet from '../impl/LslStreamOutlet.js'

async function main() {
    const outlet = await LslStreamOutlet.Create({
        name: '10 Hz Pulse',
        type: 'HZ',
        sourceId: '10-hz-pulse',
        channelNames: ['Ch1', 'Ch2', 'Ch3'],
        channelFormat: 'float32',
        sampleRateHz: 10,
        chunkSize: 1,
    })

    for (let i = 0; i < 100; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100))

        outlet.pushSample([
            Math.random() * 100,
            Math.random() * 100,
            Math.random() * 100,
        ])
    }
}

main().catch((error) => {
    console.error('Error in main:', error)
})

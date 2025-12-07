import LslStreamOutlet from '../impl/LslStreamOutlet.js'

async function main() {
    const instance = await LslStreamOutlet.Create({
        name: 'Muse S (2nd gen)',
        type: 'EEG',
        channelNames: ['TP9', 'AF7', 'AF8', 'TP10', 'AUX'],
        sampleRateHz: 10,
        channelFormat: 'float32',
        sourceId: 'muse-s-eeg',
        manufacturer: 'Interaxon Inc.',
        units: 'microvolt',
        chunkSize: 12,
    })

    for (let i = 0; i < 100; i++) {
        await new Promise((resolve) => setTimeout(resolve, 100))

        instance.pushSample([
            Math.random() * 100,
            Math.random() * 100,
            Math.random() * 100,
            Math.random() * 100,
            Math.random() * 100,
        ])
    }
}

main().catch((error) => {
    console.error('Error in main:', error)
})

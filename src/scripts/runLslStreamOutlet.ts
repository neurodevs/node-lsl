import LslStreamOutlet from '../impl/LslStreamOutlet.js'

async function main() {
    const instance = await LslStreamOutlet.Create({
        name: 'Muse S (2nd gen)',
        type: 'EEG',
        channelNames: ['TP9', 'AF7', 'AF8', 'TP10', 'AUX'],
        sampleRateHz: 256,
        channelFormat: 'float32',
        sourceId: 'muse-s-eeg',
        manufacturer: 'Interaxon Inc.',
        unit: 'microvolt',
        chunkSize: 12,
    })

    instance.pushSample([1, 2, 3, 4, 5])
}

main().catch((error) => {
    console.error('Error in main:', error)
})

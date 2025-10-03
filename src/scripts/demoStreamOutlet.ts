import LslStreamOutlet from '../modules/LslStreamOutlet'

async function main() {
    const instance = await LslStreamOutlet.Create({
        name: 'Muse S (2nd gen)',
        type: 'EEG',
        channelNames: ['TP9', 'AF7', 'AF8', 'TP10', 'AUX'],
        sampleRate: 256,
        channelFormat: 'float32',
        sourceId: 'muse-s-eeg',
        manufacturer: 'Interaxon Inc.',
        unit: 'microvolt',
        chunkSize: 12,
        maxBuffered: 360,
    })

    instance.pushSample([1, 2, 3, 4, 5])
}

main().catch((error) => {
    console.error('Error in main:', error)
})

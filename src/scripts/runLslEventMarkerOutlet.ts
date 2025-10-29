import LslEventMarkerOutlet from '../impl/LslEventMarkerOutlet.js'

async function main() {
    const outlet = await LslEventMarkerOutlet.Create()

    const markers = [
        { name: 'phase-1-begin', durationMs: 100 },
        { name: 'phase-1-end', durationMs: 10 },
    ]

    // Hangs until complete
    await outlet.pushMarkers(markers)

    // Void promise, does not hang
    void outlet.pushMarkers(markers)

    // Interrupts the above pushMarkers process
    outlet.stop()
}

main().catch((error) => {
    console.error('Error in main:', error)
})

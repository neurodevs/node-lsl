import { DurationMarker } from '../types.js'
import LslStreamOutlet, {
    StreamOutletOptions,
    StreamOutlet,
} from './LslStreamOutlet.js'

export default class LslEventMarkerOutlet implements EventMarkerOutlet {
    public static Class?: EventMarkerOutletConstructor

    protected outlet: StreamOutlet
    private isPlaying = false
    private waitResolve?: () => void
    private timeout?: any

    protected constructor(outlet: StreamOutlet) {
        this.outlet = outlet
    }

    public static async Create(options?: Partial<StreamOutletOptions>) {
        const defaultOptions = {
            name: 'Event markers',
            type: 'Markers',
            channelNames: ['Markers'],
            sampleRate: 0,
            channelFormat: 'string',
            sourceId: 'event-markers',
            manufacturer: 'N/A',
            unit: 'N/A',
            chunkSize: 0,
            maxBuffered: 0,
        } as StreamOutletOptions

        const outlet = await LslStreamOutlet.Create({
            ...defaultOptions,
            ...options,
        })

        return new (this.Class ?? this)(outlet)
    }

    public pushMarker(markerName: string) {
        this.pushMarkerToOutlet(markerName)
    }

    public async pushMarkers(markers: DurationMarker[]) {
        this.isPlaying = true

        for (let marker of markers) {
            const { name, durationMs } = marker
            this.pushMarkerToOutlet(name)

            await this.wait(durationMs)

            if (!this.isPlaying) {
                return
            }
        }
    }

    private pushMarkerToOutlet(markerName: string) {
        this.outlet.pushSample([markerName])
    }

    protected async wait(durationMs: number) {
        return new Promise((resolve) => this.setTimeout(resolve, durationMs))
    }

    private setTimeout(resolve: (value: unknown) => void, durationMs: number) {
        this.waitResolve = resolve as any
        this.timeout = setTimeout(resolve, durationMs)
    }

    public stop() {
        this.waitResolve?.()
        clearTimeout(this.timeout)
        this.isPlaying = false
    }
}

export interface EventMarkerOutlet {
    pushMarker(markerName: string): void
    pushMarkers(markers: DurationMarker[]): Promise<void>
    stop(): void
}

export type EventMarkerOutletConstructor = new (
    outlet: StreamOutlet
) => EventMarkerOutlet

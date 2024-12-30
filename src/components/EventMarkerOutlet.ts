import { DurationMarker } from '../nodeLsl.types'
import LslStreamOutlet, { LslOutletOptions, LslOutlet } from './LslStreamOutlet'

export default class EventMarkerOutlet implements MarkerOutlet {
    public static Class?: MarkerOutletConstructor

    protected lslOutlet: LslOutlet
    private isPlaying = false
    private waitResolve?: () => void
    private timeout?: any

    protected constructor(lslOutlet: LslOutlet) {
        this.lslOutlet = lslOutlet
    }

    public static async Create(options?: Partial<LslOutletOptions>) {
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
        } as LslOutletOptions

        const outlet = await LslStreamOutlet.Create({
            ...defaultOptions,
            ...options,
        })

        return new (this.Class ?? this)(outlet)
    }

    public async pushMarkers(markers: DurationMarker[]) {
        this.isPlaying = true

        for (let marker of markers) {
            this.lslOutlet.pushSample([marker.name])

            await this.wait(marker.durationMs)

            if (!this.isPlaying) {
                return
            }
        }
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

export interface MarkerOutlet {
    pushMarkers(markers: DurationMarker[]): Promise<void>
    stop(): void
}

export type MarkerOutletConstructor = new (lslOutlet: LslOutlet) => MarkerOutlet

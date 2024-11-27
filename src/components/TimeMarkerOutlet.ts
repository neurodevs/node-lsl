import { DurationMarker } from '../nodeLsl.types'
import LslOutletImpl, { LslOutlet, LslOutletOptions } from './LslOutlet'

export default class TimeMarkerOutletImpl
    extends LslOutletImpl
    implements TimeMarkerOutlet
{
    public static Class?: TimeMarkerOutletConstructor

    private isPlaying = false
    private waitResolve?: () => void
    private timeout?: any

    public static async Create(options?: Partial<LslOutletOptions>) {
        const defaultOptions = {
            name: 'Time markers',
            type: 'Markers',
            channelNames: ['Markers'],
            sampleRate: 0,
            channelFormat: 'string',
            sourceId: 'time-markers',
            manufacturer: 'N/A',
            unit: 'N/A',
            chunkSize: 0,
            maxBuffered: 0,
        } as LslOutletOptions

        return new (this.Class ?? this)({
            ...defaultOptions,
            ...options,
        }) as TimeMarkerOutlet
    }

    public async pushMarkers(markers: DurationMarker[]) {
        this.isPlaying = true

        for (let marker of markers) {
            this.pushSample([marker.name])

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

export interface TimeMarkerOutlet extends LslOutlet {
    pushMarkers(markers: DurationMarker[]): Promise<void>
    stop(): void
}

export type TimeMarkerOutletConstructor = new (
    options: LslOutletOptions
) => TimeMarkerOutlet

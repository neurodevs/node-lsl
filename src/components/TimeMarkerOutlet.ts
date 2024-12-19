import { DurationMarker } from '../nodeLsl.types'
import LslOutletImpl, { LslOutlet, LslOutletOptions } from './LslOutlet'
import LslStreamInfo, { StreamInfo } from './LslStreamInfo'

export default class TimeMarkerOutletImpl
    extends LslOutletImpl
    implements TimeMarkerOutlet
{
    public static Class?: TimeMarkerOutletConstructor

    private isPlaying = false
    private waitResolve?: () => void
    private timeout?: any

    public static async Create(options?: Partial<LslOutletOptions>) {
        const { unit, manufacturer, maxBuffered, chunkSize } = options ?? {}

        const infoOptions = {
            name: 'Time markers',
            type: 'Markers',
            channelNames: ['Markers'],
            sampleRate: 0,
            channelFormat: 'string',
            sourceId: 'time-markers',
            units: unit ?? 'N/A',
            ...options,
        } as LslOutletOptions

        const info = LslStreamInfo.Create(infoOptions)

        const outletOptions = {
            ...infoOptions,
            chunkSize: chunkSize ?? 0,
            maxBuffered: maxBuffered ?? 0,
            manufacturer: manufacturer ?? 'N/A',
            unit: unit ?? 'N/A',
        }

        // @ts-ignore
        delete outletOptions.units

        return new (this.Class ?? this)(info, outletOptions) as TimeMarkerOutlet
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
    info: StreamInfo,
    options: LslOutletOptions
) => TimeMarkerOutlet

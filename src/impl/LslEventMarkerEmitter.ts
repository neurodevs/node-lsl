import LslStreamOutlet, {
    StreamOutletOptions,
    StreamOutlet,
} from './LslStreamOutlet.js'

export default class LslEventMarkerEmitter implements EventMarkerEmitter {
    public static Class?: EventMarkerEmitterConstructor

    protected outlet: StreamOutlet
    private isPlaying = false
    private waitResolve?: () => void
    private timeout?: any

    protected constructor(outlet: StreamOutlet) {
        this.outlet = outlet
    }

    public static async Create(options?: EventMarkerEmitterOptions) {
        const outlet = await this.LslStreamOutlet(options)
        return new (this.Class ?? this)(outlet)
    }

    public emit(marker: EventMarker) {
        const { name } = marker
        this.pushMarkerToOutlet(name)
    }

    public async emitMany(markers: TimedEventMarker[]) {
        this.isPlaying = true

        for (const marker of markers) {
            const { name, waitForMs } = marker
            this.pushMarkerToOutlet(name)

            await this.wait(waitForMs)

            if (!this.isPlaying) {
                return
            }
        }
    }

    private pushMarkerToOutlet(markerName: string) {
        this.outlet.pushSample([markerName])
    }

    protected async wait(forMs: number) {
        return new Promise((resolve) => this.setTimeout(resolve, forMs))
    }

    private setTimeout(resolve: (value: unknown) => void, waitForMs: number) {
        this.waitResolve = resolve as any
        this.timeout = setTimeout(resolve, waitForMs)
    }

    public interrupt() {
        this.waitResolve?.()
        clearTimeout(this.timeout)
        this.isPlaying = false
    }

    public destroy() {
        this.outlet.destroy()
    }

    private static readonly defaultOutletOptions = {
        name: 'Event markers',
        type: 'Markers',
        channelNames: ['Markers'],
        sampleRateHz: 0,
        channelFormat: 'string',
        sourceId: 'event-markers',
        manufacturer: 'N/A',
        units: 'N/A',
        chunkSize: 0,
        maxBufferedMs: 0,
    } as StreamOutletOptions

    private static LslStreamOutlet(options?: Partial<StreamOutletOptions>) {
        return LslStreamOutlet.Create({
            ...this.defaultOutletOptions,
            ...options,
        })
    }
}

export interface EventMarkerEmitter {
    emit(marker: EventMarker): void
    emitMany(markers: TimedEventMarker[]): Promise<void>
    interrupt(): void
    destroy(): void
}

export type EventMarkerEmitterOptions = Partial<StreamOutletOptions>

export type EventMarkerEmitterConstructor = new (
    outlet: StreamOutlet
) => EventMarkerEmitter

export interface EventMarker {
    name: string
    waitForMs?: number
}

export type TimedEventMarker = Required<EventMarker>

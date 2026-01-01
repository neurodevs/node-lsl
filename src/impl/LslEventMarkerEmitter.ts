import { generateShortId } from '@neurodevs/generate-id'

import LslStreamOutlet, {
    StreamOutletOptions,
    StreamOutlet,
} from './LslStreamOutlet.js'

export default class LslEventMarkerEmitter implements EventMarkerEmitter {
    public static Class?: EventMarkerEmitterConstructor

    protected outlet: StreamOutlet
    private isRunning = false
    private waitResolve?: () => void
    private timeout?: any

    protected constructor(outlet: StreamOutlet) {
        this.outlet = outlet
    }

    public static async Create(options?: EventMarkerEmitterOptions) {
        const outlet = await this.LslStreamOutlet(options)
        return new (this.Class ?? this)(outlet)
    }

    public async emit(marker: EventMarker) {
        const { name, waitForMs } = marker
        this.pushMarkerToOutlet(name)

        if (waitForMs) {
            await this.wait(waitForMs)
        }
    }

    public async emitMany(markers: TimedEventMarker[]) {
        this.throwIfAlreadyRunning()

        this.isRunning = true

        for (const marker of markers) {
            const { name, waitForMs } = marker
            this.pushMarkerToOutlet(name)

            await this.wait(waitForMs)

            if (!this.isRunning) {
                return
            }
        }
    }

    private throwIfAlreadyRunning() {
        if (this.isRunning) {
            throw new Error('Cannot call emitMany while already running!')
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
        this.isRunning = false
    }

    public destroy() {
        if (this.isRunning) {
            this.interrupt()
        }
        this.outlet.destroy()
    }

    private static generateDefaultOutletOptions() {
        const uniqueId = generateShortId()

        const name = `Event markers (${uniqueId})`
        const sourceId = `event-markers-${uniqueId}`

        return {
            name,
            type: 'Markers',
            sourceId,
            channelNames: ['Markers'],
            channelFormat: 'string',
            sampleRateHz: 0,
            chunkSize: 1,
        } as StreamOutletOptions
    }

    private static LslStreamOutlet(options?: Partial<StreamOutletOptions>) {
        return LslStreamOutlet.Create({
            ...this.generateDefaultOutletOptions(),
            ...options,
        })
    }
}

export interface EventMarkerEmitter {
    emit(marker: EventMarker): Promise<void>
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

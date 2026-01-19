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

    public async emit(markerName: string, options?: EventMarkerOptions) {
        this.throwIfAlreadyRunning('emit')
        this.isRunning = true

        const { waitAfterMs } = options || {}

        this.pushMarkerToOutlet(markerName)

        if (waitAfterMs) {
            await this.wait(waitAfterMs)
        }
        this.isRunning = false
    }

    private throwIfAlreadyRunning(methodName: string) {
        if (this.isRunning) {
            throw new Error(`Cannot call ${methodName} while already running!`)
        }
    }

    public async emitMany(markers: TimedEventMarker[]) {
        this.throwIfAlreadyRunning('emitMany')
        this.isRunning = true

        for (const marker of markers) {
            const { name, waitAfterMs } = marker
            this.pushMarkerToOutlet(name)

            await this.wait(waitAfterMs)

            if (!this.isRunning) {
                return
            }
        }
        this.isRunning = false
    }

    private pushMarkerToOutlet(markerName: string) {
        this.outlet.pushSample([markerName])
    }

    protected async wait(forMs: number) {
        return new Promise((resolve) => this.setTimeout(resolve, forMs))
    }

    private setTimeout(resolve: (value: unknown) => void, waitAfterMs: number) {
        this.waitResolve = resolve as any
        this.timeout = setTimeout(resolve, waitAfterMs)
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
    emit(markerName: string, options?: EventMarkerOptions): Promise<void>
    emitMany(markers: TimedEventMarker[]): Promise<void>
    interrupt(): void
    destroy(): void
}

export type EventMarkerEmitterOptions = Partial<StreamOutletOptions>

export type EventMarkerEmitterConstructor = new (
    outlet: StreamOutlet
) => EventMarkerEmitter

export interface EventMarkerOptions {
    waitAfterMs?: number
}

export interface TimedEventMarker {
    name: string
    waitAfterMs: number
}

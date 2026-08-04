import LslStreamOutlet, { LslOutlet } from './LslStreamOutlet.js'

export default class LslJsonOutlet implements JsonOutlet {
    public static Class?: JsonOutletConstructor
    public static backupIdCounter = 0

    private outlet: LslOutlet
    private maxBytesPerSample?: number

    protected constructor(outlet: LslOutlet, maxBytesPerSample?: number) {
        this.outlet = outlet
        this.maxBytesPerSample = maxBytesPerSample
    }

    public pushJson(data: Json) {
        const json = JSON.stringify(data)
        this.throwIfPayloadTooLarge(json)
        this.outlet.pushSample([json])
    }

    private throwIfPayloadTooLarge(json: string) {
        if (this.maxBytesPerSample && json.length > this.maxBytesPerSample) {
            throw new Error(
                `Payload of ${json.length} bytes exceeds maxBytesPerSample of ${this.maxBytesPerSample}!`
            )
        }
    }

    public destroy() {
        this.outlet.destroy()
    }

    public static async Create(options?: JsonOutletOptions) {
        const outlet = await this.LslStreamOutlet(options)
        return new (this.Class ?? this)(outlet, options?.maxBytesPerSample)
    }

    private static LslStreamOutlet(options?: JsonOutletOptions) {
        this.backupIdCounter++

        const { channelName, maxBytesPerSample: _, ...rest } = options ?? {}

        return LslStreamOutlet.Create({
            name: `JSON (json-${this.backupIdCounter})`,
            type: 'JSON',
            sourceId: `json-${this.backupIdCounter}`,
            channelNames: [channelName ?? 'JSON'],
            channelFormat: 'string',
            sampleRateHz: 0,
            chunkSize: 1,
            ...rest,
        })
    }
}

export interface JsonOutlet {
    pushJson(data: Json): void
    destroy(): void
}

export type Json = Record<string, unknown>

export type JsonOutletConstructor = new (
    outlet: LslOutlet,
    maxBytesPerSample?: number
) => JsonOutlet

export interface JsonOutletOptions {
    name?: string
    type?: string
    sourceId?: string
    channelName?: string
    sampleRateHz?: number
    chunkSize?: number
    maxBufferedMs?: number
    maxBytesPerSample?: number
    manufacturer?: string
    units?: string
    waitAfterConstructionMs?: number
}

export type JsonOutletConstructorOptions = Omit<
    JsonOutletOptions,
    'waitAfterConstructionMs'
>

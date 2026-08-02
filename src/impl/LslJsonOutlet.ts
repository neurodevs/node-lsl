import LslStreamOutlet from './LslStreamOutlet.js'

export default class LslJsonOutlet implements JsonOutlet {
    public static Class?: JsonOutletConstructor

    protected constructor(_options?: JsonOutletOptions) {}

    public static async Create(options?: JsonOutletOptions) {
        await this.LslStreamOutlet(options)
        return new (this.Class ?? this)(options)
    }

    private static LslStreamOutlet(options?: JsonOutletOptions) {
        return LslStreamOutlet.Create({
            name: `JSON (json-1)`,
            type: 'JSON',
            sourceId: 'json-1',
            channelNames: ['JSON'],
            channelFormat: 'string',
            sampleRateHz: 0,
            chunkSize: 1,
            ...options,
        })
    }
}

export interface JsonOutlet {}

export type JsonOutletConstructor = new (
    options?: JsonOutletOptions
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

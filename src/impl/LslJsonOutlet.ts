export default class LslJsonOutlet implements JsonOutlet {
    public static Class?: JsonOutletConstructor

    protected constructor(_options?: JsonOutletOptions) {}

    public static async Create(options?: JsonOutletOptions) {
        return new (this.Class ?? this)(options)
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

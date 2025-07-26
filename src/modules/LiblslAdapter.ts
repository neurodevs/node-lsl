import { assertOptions } from '@sprucelabs/schema'
import { DataType, define, open } from 'ffi-rs'
import SpruceError from '../errors/SpruceError'
import {
    Liblsl,
    LiblslBindings,
    CreateStreamInfoOptions,
    AppendChannelsToStreamInfoOptions,
    CreateOutletOptions,
    DestroyOutletOptions,
    PushSampleFloatTimestampOptions,
    PushSampleStringTimestampOptions,
    CreateInletOptions,
    DestroyInletOptions,
} from '../types'

export default class LiblslAdapter implements Liblsl {
    private static instance?: Liblsl
    public static ffiRsOpen = open
    public static ffiRsDefine = define

    private bindings!: LiblslBindings

    protected constructor() {
        const path = process.env.LIBLSL_PATH! ?? this.defaultMacOsPath
        this.tryToLoadBindings(path)
    }

    private tryToLoadBindings(path: string) {
        try {
            this.bindings = this.loadBindings(path)
        } catch (error) {
            throw new SpruceError({
                code: 'FAILED_TO_LOAD_LIBLSL',
                liblslPath: path,
                originalError: error as any,
            })
        }
    }

    public static getInstance() {
        if (!this.instance) {
            this.setInstance(new this())
        }
        return this.instance!
    }

    public static setInstance(instance: Liblsl) {
        this.instance = instance
    }

    public static resetInstance() {
        delete this.instance
    }

    private loadBindings(liblslPath: string) {
        LiblslAdapter.ffiRsOpen({
            library: 'lsl',
            path: liblslPath,
        })

        return LiblslAdapter.ffiRsDefine({
            lsl_create_streaminfo: {
                library: 'lsl',
                retType: DataType.External,
                paramsType: [
                    DataType.String,
                    DataType.String,
                    DataType.I32,
                    DataType.Double,
                    DataType.I32,
                    DataType.String,
                ],
            },
            lsl_create_outlet: {
                library: 'lsl',
                retType: DataType.External,
                paramsType: [DataType.External, DataType.I32, DataType.I32],
            },
            lsl_destroy_outlet: {
                library: 'lsl',
                retType: DataType.Void,
                paramsType: [DataType.External],
            },
            lsl_create_inlet: {
                library: 'lsl',
                retType: DataType.External,
                paramsType: [DataType.External, DataType.I32, DataType.I32],
            },
            lsl_destroy_inlet: {
                library: 'lsl',
                retType: DataType.Void,
                paramsType: [DataType.External],
            },
            lsl_local_clock: {
                library: 'lsl',
                retType: DataType.Double,
                paramsType: [],
            },
            lsl_push_sample_ft: {
                library: 'lsl',
                retType: DataType.Void,
                paramsType: [
                    DataType.External,
                    DataType.FloatArray,
                    DataType.Double,
                ],
            },
            lsl_push_sample_strt: {
                library: 'lsl',
                retType: DataType.Void,
                paramsType: [
                    DataType.External,
                    DataType.StringArray,
                    DataType.Double,
                ],
            },
            lsl_get_desc: {
                library: 'lsl',
                retType: DataType.External,
                paramsType: [DataType.External],
            },
            lsl_append_child: {
                library: 'lsl',
                retType: DataType.External,
                paramsType: [DataType.External, DataType.String],
            },
            lsl_append_child_value: {
                library: 'lsl',
                retType: DataType.External,
                paramsType: [
                    DataType.External,
                    DataType.String,
                    DataType.String,
                ],
            },
        }) as unknown as LiblslBindings
    }

    public createStreamInfo(options: CreateStreamInfoOptions) {
        const {
            name,
            type,
            channelCount,
            sampleRate,
            channelFormat,
            sourceId,
        } = assertOptions(options, [
            'name',
            'type',
            'channelCount',
            'sampleRate',
            'channelFormat',
            'sourceId',
        ])

        return this.bindings.lsl_create_streaminfo([
            name,
            type,
            channelCount,
            sampleRate,
            channelFormat,
            sourceId,
        ])
    }

    public appendChannelsToStreamInfo(
        options: AppendChannelsToStreamInfoOptions
    ) {
        const { info, channels } = assertOptions(options, ['info', 'channels'])

        const description = this.bindings.lsl_get_desc([info])
        const parent = this.bindings.lsl_append_child([description, 'channels'])

        for (const channel of channels) {
            const child = this.bindings.lsl_append_child([parent, 'channel'])
            this.bindings.lsl_append_child_value([
                child,
                'label',
                channel.label,
            ])
            this.bindings.lsl_append_child_value([child, 'unit', channel.unit])
            this.bindings.lsl_append_child_value([child, 'type', channel.type])
        }
    }

    public createOutlet(options: CreateOutletOptions) {
        const { info, chunkSize, maxBuffered } = assertOptions(options, [
            'info',
            'chunkSize',
            'maxBuffered',
        ])

        return this.bindings.lsl_create_outlet([info, chunkSize, maxBuffered])
    }

    public pushSampleFloatTimestamp(options: PushSampleFloatTimestampOptions) {
        const { outlet, sample, timestamp } = assertOptions(options, [
            'outlet',
            'sample',
            'timestamp',
        ])
        this.bindings.lsl_push_sample_ft([outlet, sample, timestamp])
    }

    public pushSampleStringTimestamp(
        options: PushSampleStringTimestampOptions
    ) {
        const { outlet, sample, timestamp } = assertOptions(options, [
            'outlet',
            'sample',
            'timestamp',
        ])
        this.bindings.lsl_push_sample_strt([outlet, sample, timestamp])
    }

    public destroyOutlet(options: DestroyOutletOptions) {
        const { outlet } = assertOptions(options, ['outlet'])
        this.bindings.lsl_destroy_outlet([outlet])
    }

    public createInlet(options: CreateInletOptions) {
        const { info, chunkSize, maxBuffered } = assertOptions(options, [
            'info',
            'chunkSize',
            'maxBuffered',
        ])

        return this.bindings.lsl_create_inlet([info, chunkSize, maxBuffered])
    }

    public destroyInlet(_options: DestroyInletOptions) {}

    public localClock() {
        return this.bindings.lsl_local_clock([])
    }

    private readonly defaultMacOsPath =
        '/opt/homebrew/Cellar/lsl/1.16.2/lib/liblsl.1.16.2.dylib'
}

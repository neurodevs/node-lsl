import { WorkerOptions } from 'node:worker_threads'

import { OnDataCallback } from '../../impl/LslStreamInlet.js'
import StreamInletWorker from '../../impl/workers/inlet/StreamInletWorker.js'
import {
    createOutlet,
    destroyOutlet,
    pushSample,
} from '../../impl/workers/outlet/LslStreamOutlet.worker.js'

export default class FakeWorker {
    public static callsToConstructor: {
        filename: string | URL
        options?: WorkerOptions
    }[] = []

    public static callsToPostMessage: WorkerMessage[] = []

    public static callsToOn: {
        type: string
        listener: (...args: unknown[]) => void
    }[] = []

    public static inletWorker = new StreamInletWorker()
    public static fakeOnData: OnDataCallback

    public createInletPromise?: Promise<void>

    public constructor(filename: string | URL, options?: WorkerOptions) {
        FakeWorker.callsToConstructor.push({ filename, options })
    }

    public postMessage(msg: WorkerMessage) {
        FakeWorker.callsToPostMessage.push(msg)

        const { type } = msg

        switch (type) {
            case 'createOutlet': {
                createOutlet(msg as any)
                break
            }
            case 'pushSample': {
                pushSample(msg as any)
                break
            }
            case 'destroyOutlet': {
                destroyOutlet()
                break
            }
            case 'createInlet': {
                const { payload } = msg
                this.createInletPromise = this.inletWorker.createInlet(
                    payload as any
                )
                break
            }
            case 'startPulling': {
                this.inletWorker.startPulling(this.fakeOnData)
                break
            }
            case 'flushQueue': {
                this.inletWorker.flushQueue()
                break
            }
            case 'stopPulling': {
                this.inletWorker.stopPulling()
                break
            }
            case 'destroyInlet': {
                this.inletWorker.destroyInlet()
                break
            }
        }
    }

    public on(type: string, listener: (...args: unknown[]) => void) {
        FakeWorker.callsToOn.push({ type, listener })
    }

    private get inletWorker() {
        return FakeWorker.inletWorker
    }

    private get fakeOnData() {
        return FakeWorker.fakeOnData
    }

    public static resetTestDoubles() {
        this.callsToConstructor = []
        this.callsToPostMessage = []
        this.callsToOn = []
    }
}

export interface WorkerMessage {
    type: string
    payload?: Record<string, unknown>[]
}

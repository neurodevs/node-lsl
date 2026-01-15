import { WorkerOptions } from 'node:worker_threads'
import {
    createOutlet,
    destroyOutlet,
    pushSample,
} from '../../impl/workers/LslStreamOutlet.worker.js'

export default class FakeWorker {
    public static callsToConstructor: {
        filename: string | URL
        options?: WorkerOptions
    }[] = []

    public static callsToPostMessage: WorkerMessage[] = []

    public constructor(filename: string | URL, options?: WorkerOptions) {
        FakeWorker.callsToConstructor.push({ filename, options })
    }

    public postMessage(msg: WorkerMessage) {
        FakeWorker.callsToPostMessage.push(msg)

        switch (msg.type) {
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
        }
    }

    public static resetTestDoubles() {
        this.callsToConstructor = []
        this.callsToPostMessage = []
    }
}

export interface WorkerMessage {
    type: string
    payload?: Record<string, unknown>[]
}

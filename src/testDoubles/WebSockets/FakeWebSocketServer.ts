import FakeWebSocket from './FakeWebSocket.js'

export default class FakeWebSocketServer {
    public static callsToConstructor: FakeWSSConstructorOptions[] = []
    public static numCallsToClose = 0

    public static clients = new Set<FakeWebSocket>([
        new FakeWebSocket(),
        new FakeWebSocket(),
    ])

    public clients = FakeWebSocketServer.clients

    public constructor(options: FakeWSSConstructorOptions) {
        FakeWebSocketServer.callsToConstructor.push(options)
    }

    public close() {
        FakeWebSocketServer.numCallsToClose += 1
    }

    public static resetTestDouble() {
        FakeWebSocketServer.callsToConstructor = []
        FakeWebSocketServer.numCallsToClose = 0

        FakeWebSocket.resetTestDouble()
    }
}

export interface FakeWSSConstructorOptions {
    port: number
}

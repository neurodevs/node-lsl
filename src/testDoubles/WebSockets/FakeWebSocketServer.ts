export default class FakeWebSocketServer {
    public static callsToConstructor: FakeWSSConstructorOptions[] = []
    public static numCallsToClose = 0

    public constructor(options: FakeWSSConstructorOptions) {
        FakeWebSocketServer.callsToConstructor.push(options)
    }

    public close() {
        FakeWebSocketServer.numCallsToClose += 1
    }

    public static resetTestDouble() {
        FakeWebSocketServer.callsToConstructor = []
        FakeWebSocketServer.numCallsToClose = 0
    }
}

export interface FakeWSSConstructorOptions {
    port: number
}

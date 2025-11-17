export default class FakeWebSocketServer {
    public static callsToConstructor: FakeWSSConstructorOptions[] = []

    public constructor(options: FakeWSSConstructorOptions) {
        FakeWebSocketServer.callsToConstructor.push(options)
    }

    public static resetTestDouble() {
        FakeWebSocketServer.callsToConstructor = []
    }
}

export interface FakeWSSConstructorOptions {
    port: number
}

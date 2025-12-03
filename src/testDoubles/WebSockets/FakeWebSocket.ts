import generateId from '@neurodevs/generate-id'
import WebSocket from 'ws'

export default class FakeWebSocket {
    public static callsToConstructor: string[] = []
    public static callsToSend: { id: string; data: unknown }[] = []

    public readyState: number = WebSocket.OPEN
    public id = generateId()

    public constructor(url: string) {
        FakeWebSocket.callsToConstructor.push(url)
    }

    public send(data: unknown) {
        FakeWebSocket.callsToSend.push({ id: this.id, data })
    }

    public static resetTestDouble() {
        this.callsToConstructor = []
        this.callsToSend = []
    }
}

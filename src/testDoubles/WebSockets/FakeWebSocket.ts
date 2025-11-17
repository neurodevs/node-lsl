import generateId from '@neurodevs/generate-id'

export default class FakeWebSocket {
    public static callsToSend: { id: string; data: unknown }[] = []

    public id = generateId()

    public send(data: unknown) {
        FakeWebSocket.callsToSend.push({ id: this.id, data })
    }

    public static resetTestDouble() {
        FakeWebSocket.callsToSend = []
    }
}

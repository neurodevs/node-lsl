import { Json, JsonOutlet } from '../../impl/LslJsonOutlet.js'

export default class FakeJsonOutlet implements JsonOutlet {
    public static numCallsToConstructor = 0
    public static callsToPushJson: Json[] = []
    public static numCallsToDestroy = 0

    public constructor() {
        FakeJsonOutlet.numCallsToConstructor++
    }

    public pushJson(data: Json) {
        FakeJsonOutlet.callsToPushJson.push(data)
    }

    public destroy() {
        FakeJsonOutlet.numCallsToDestroy++
    }

    public static resetTestDouble() {
        FakeJsonOutlet.numCallsToConstructor = 0
        FakeJsonOutlet.callsToPushJson = []
        FakeJsonOutlet.numCallsToDestroy = 0
    }
}

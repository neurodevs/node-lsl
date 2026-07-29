import { JsonOutlet } from '../../impl/LslJsonOutlet.js'

export default class FakeJsonOutlet implements JsonOutlet {
    public static numCallsToConstructor = 0

    public constructor() {
        FakeJsonOutlet.numCallsToConstructor++
    }

    public static resetTestDouble() {
        FakeJsonOutlet.numCallsToConstructor = 0
    }
}

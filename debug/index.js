import { observable, observe } from '@nx-js/observer-util'

const clock = observable({ time: new Date() })
observe(() => console.log(clock.time))

setInterval(() => clock.time = new Date(), 1000)

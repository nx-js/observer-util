export class StackManager {
  constructor (onFlush) {
    this.stacks = []
    this.onFlush = onFlush
  }

  uuid = 0;
  getUUID () {
    return this.uuid++
  }

  start (target) {
    this.stacks.push(target)
  }

  end (target) {
    const lastStack = this.stacks[this.stacks.length - 1]
    if (lastStack !== target) {
      throw new Error('transaction end not match with start')
    }
    this.stacks.pop()
    if (!this.duringStack) {
      this.onFlush && this.onFlush()
    }
  }

  get duringStack () {
    return this.stacks.length > 0
  }
}

export class Utils {
}

class TableGuesser {
  static CREATE_PATTERNS = [
    /^create_(\w+)_table$/,
    /^create_(\w+)$/
  ]
  static CHANGE_PATTERNS = [
    /.+_(to|from|in)_(\w+)_table$/,
    /.+_(to|from|in)_(\w+)$/
  ]
  static guess (migration: string) {
    for (const pattern of TableGuesser.CREATE_PATTERNS) {
      const matches = migration.match(pattern)
      if (matches) {
        return [matches[1], true]
      }
    }
    for (const pattern of TableGuesser.CHANGE_PATTERNS) {
      const matches = migration.match(pattern)
      if (matches) {
        return [matches[2], false]
      }
    }
    return []
  }
}

export { TableGuesser }

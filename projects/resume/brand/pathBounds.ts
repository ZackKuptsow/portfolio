/** The box around a path's points, in the path's own units, with y pointing down. */
export type PathBounds = { bottom: number; left: number; right: number; top: number }

const COMMAND_PATTERN = /([A-Za-z])([^A-Za-z]*)/g
const NUMBER_PATTERN = /-?\d*\.?\d+(?:e-?\d+)?/g

/**
 * The bounds of an absolute path made of `M`, `L`, `H`, `V` and `Z`, which is what the outline
 * script writes for letters with no curves, such as "zk". Any other command throws, because its
 * control points would make the box wrong without saying so.
 */
export function pathBounds(d: string): PathBounds {
  const xs: number[] = []
  const ys: number[] = []
  let x = 0
  let y = 0
  for (const [, command, argumentText] of d.matchAll(COMMAND_PATTERN)) {
    const numbers = (argumentText.match(NUMBER_PATTERN) ?? []).map(Number)
    if (command === 'Z') {
      continue
    }
    if (command === 'M' || command === 'L') {
      for (let index = 0; index < numbers.length; index += 2) {
        x = numbers[index]
        y = numbers[index + 1]
        xs.push(x)
        ys.push(y)
      }
      continue
    }
    if (command === 'H') {
      for (const value of numbers) {
        x = value
        xs.push(x)
        ys.push(y)
      }
      continue
    }
    if (command === 'V') {
      for (const value of numbers) {
        y = value
        xs.push(x)
        ys.push(y)
      }
      continue
    }
    throw new Error(`pathBounds reads only M, L, H, V and Z, and the path has ${command}`)
  }
  return {
    bottom: Math.max(...ys),
    left: Math.min(...xs),
    right: Math.max(...xs),
    top: Math.min(...ys),
  }
}

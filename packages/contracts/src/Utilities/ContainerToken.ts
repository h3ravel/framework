export const CONTAINER_TOKEN = Symbol.for('@h3ravel/contracts/container-token')

export const createContainerToken = (name: string) => (
    Symbol.for(`@h3ravel/contracts/${name}`)
)

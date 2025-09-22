import escalade from 'escalade'
import path from 'node:path'
import { stat } from 'node:fs/promises'

export const findUpConfig = async (base: string, name: string, extensions: string[]) => {
    return (await escalade(process.cwd(), async (_dir) => {
        try {
            for (const ext of extensions) {
                const filename = path.join(_dir, base, name + '.' + ext)
                if (await exists(filename)) {
                    return filename
                }
            }
        } catch {/** */ }
        return ''
    }))!
}

export const exists = async (e: string) => {
    try {
        await stat(e)
        return true
    } catch {
        return false
    }
}

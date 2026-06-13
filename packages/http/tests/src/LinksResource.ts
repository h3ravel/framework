import { Collection } from '../../src/Resources/Collection'
import { Resource } from '../../src/Resources/Resource'

export class LinksResource extends Resource {
    data () {
        return this.toObject()
    }
}

export class LinksCollection extends Collection {
    collects = LinksResource
    data () {
        return this.toObject()
    }
}

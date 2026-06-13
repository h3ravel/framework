import { Collectible, CollectionLike, PaginatorLike, ResourceCollection, ResourceData } from 'resora'

export class Collection<R extends ResourceData[] | Collectible | CollectionLike | PaginatorLike = ResourceData[] | Collectible | CollectionLike | PaginatorLike, T extends ResourceData = any> extends ResourceCollection<R, T> {

}
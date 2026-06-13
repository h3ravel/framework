import { Resource as BaseResource, NonCollectible, ResourceData } from 'resora'

export class Resource<R extends ResourceData | NonCollectible = ResourceData> extends BaseResource<R> {

}
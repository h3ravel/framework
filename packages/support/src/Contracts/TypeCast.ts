export type Arrayable = { [key: string]: any, toArray (): any[] };
export type Jsonable = { [key: string]: any, toJSON (): any };
export type JsonSerializable = { [key: string]: any, jsonSerialize (): any };

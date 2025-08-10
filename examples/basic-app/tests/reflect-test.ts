import 'reflect-metadata';
function Injectable (): ClassDecorator {
    return (_arget) => { console.log(1) };
}

class Dep { }

@Injectable()
class Test {
    constructor(dep: Dep) { }
}

console.log(
    'Metadata:',
    Reflect.getMetadata('design:paramtypes', Test)
);

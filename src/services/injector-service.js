export const injector = (function () {
    const services = {};
    const defaultOpts = { isSingleton: true };
    const svc = {};

    svc.getRef = function (name) {
        if (!name) { throw Error("Service name is required to resolve it"); }
        else if (typeof name !== "string") { throw Error("Service name must be a string"); }

        name = name.trim();

        let svcObj = services[name];

        if (!svcObj && name.indexOf('Service') === -1) {
            svcObj = services[`${name}Service`];
        }

        if (!svcObj) {
            throw Error(`'${name}' is not a known service`);
        }
        return svcObj;
    };

    svc.resolve = function (name) {
        const svcObj = svc.getRef(name);

        if (svcObj.isSingleton && svcObj.instance) {
            return svcObj.instance;
        }

        let instance = null;

        if (svcObj.dependency) {
            const depLen = svcObj.dependency.length;
            const dependencies = new Array(depLen + 1);
            dependencies[0] = svcObj.type;
            for (let i = 0; i < depLen; i++) {
                dependencies[i + 1] = svc.resolve(svcObj.dependency[i]);
            }

            instance = new (svcObj.type.bind.apply(svcObj.type, dependencies))();
        }
        else {
            instance = new svcObj.type();
        }

        if (svcObj.isSingleton) {
            svcObj.instance = instance;
        }

        return instance;
    };

    svc.injectable = function (type, serviceName, defaultName) {
        svc.addService(serviceName, type, defaultName, type.dependencies);
        return type;
    };

    svc.inject = function (instance, dependencies) {
        dependencies.forEach(dependency => {
            const svcObj = svc.getRef(dependency);
            instance[svcObj.defaultName] = svc.resolve(dependency);
        });
    };

    svc.addService = function (name, type, defaultName, dependency, opts) {
        if (!name) { throw Error("Service name is required to resolve it"); }
        else if (typeof name !== "string") { throw Error("Service name must be a string"); }

        dependency = dependency || type.dependencies;

        if (dependency) {
            if (!Array.isArray(dependency)) { throw Error('Dependencies must be an array with the name of services'); }
            if (dependency.length === 0) { dependency = null; }
        }

        name = name.trim();

        opts = Object.assign(opts || {}, defaultOpts);
        const svcRef = {
            isSingleton: opts.isSingleton,
            type: type,
            instance: null,
            dependency: dependency,
            name: name,
            defaultName
        };
        services[name] = svcRef;
    };

    return svc;
})();

export function resolve(name) { return injector.resolve(name); }

export function injectable(service, serviceName, defaultName) {
    return injector.injectable(service, serviceName, defaultName);
}

export function inject(instance, ...dependencies) {
    injector.inject(instance, dependencies);
}

export function resolveDependency(component) {
    return function () {
        //var arr = [...arguments];
        return new component(...arguments);
    };
}
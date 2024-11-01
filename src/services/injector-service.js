export const injector = (function () {
    const services = {};
    const defaultOpts = { isSingleton: true, retain: false };
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

    svc.resolve = function (name, path, onlySingleton) {
        const svcObj = svc.getRef(name);

        if (svcObj.isSingleton && svcObj.instance) {
            return svcObj.instance;
        }

        if (onlySingleton && !svcObj.isSingleton) {
            throw new Error(`"${name}" is not a singleton service. Source: ${path[path.length - 1]}`);
        }

        let instance = null;

        if (svcObj.dependency) {
            const depLen = svcObj.dependency.length;
            const dependencies = new Array(depLen + 1);
            dependencies[0] = svcObj.type;
            for (let i = 0; i < depLen; i++) {
                const depToResolve = svcObj.dependency[i];
                const newPath = path ? [...path, depToResolve] : [depToResolve];
                if (path && path.indexOf(depToResolve) > -1) {
                    throw new Error(`Circular dependency not supported. Error resolving: ${newPath.join('->')}`);
                }
                dependencies[i + 1] = svc.resolve(depToResolve, newPath, svcObj.isSingleton);
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

    svc.injectable = function (type, serviceName, defaultName, opts) {
        svc.addService(serviceName, type, defaultName, type.dependencies, opts);
        return type;
    };

    svc.inject = function (instance, dependencies) {
        if (process.env.NODE_ENV !== "production") {
            if (dependencies.length < dependencies.distinct().length) {
                throw new Error(`Repeated dependency is not allow:${JSON.stringify(dependencies)}`);
            }
        }
        dependencies.forEach(dependency => {
            const svcObj = svc.getRef(dependency);
            instance[svcObj.defaultName] = svc.resolve(dependency);
        });
    };

    svc.clearInstances = function () {
        Object.keys(services).forEach(k => delete services[k].instance);
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

        opts = { ...defaultOpts, ...opts };

        // Check if this service is already registered and instance is maintained
        const hasOldInstance = services[name]?.instance;

        services[name] = {
            isSingleton: opts.isSingleton,
            retain: opts.retain,
            type: type,
            instance: null,
            dependency: dependency,
            name: name,
            defaultName
        };

        if (hasOldInstance) {
            // if a single ton instance is changed, then all the existing instances should be cleared
            const names = Object.keys(services);
            for (const sname of names) {
                const svc = services[sname];
                if (svc.instance && !svc.retain) {
                    delete svc.instance;
                }
            }
        }
    };

    return svc;
})();

export function resolve(name) { return injector.resolve(name); }

export function injectable(service, serviceName, defaultName, opts) {
    return injector.injectable(service, serviceName, defaultName, opts);
}

export function inject(instance, ...dependencies) {
    if (typeof instance === 'string') {
        dependencies.splice(0, 0, instance);
        instance = {};
    }

    if (!dependencies.length && Array.isArray(instance)) {
        dependencies = instance;
        instance = {};
    }

    if (!instance) {
        instance = {};
    }

    injector.inject(instance, dependencies);
    return instance;
}

export function clearInstances() { injector.clearInstances(); }

export function useService(...svc) { return inject({}, ...svc); }

/*export function withServices(Component, ...dependencies) {
    const svc = inject(...dependencies);
    return function (props) {
        return (<Component {...props} {...svc} />);
    };
}*/
import type { ServiceTypes, ServiceReference, ResolvedServices } from './injector-types';

type Constructor<T = any> = new (...args: any[]) => T;

interface ServiceDefinition {
    type: Constructor;
    name: string;
    defaultName: string;
    dependency?: string[];
    isSingleton: boolean;
    retain: boolean;
    instance?: any;
}

export interface ServiceOptions {
    isSingleton?: boolean;
    retain?: boolean;
}

export interface ServiceConstructor<T = any> {
    new (...args: any[]): T;
    dependencies?: string[] | unknown;
}

class Injector {
    private services: Map<string, ServiceDefinition> = new Map();
    private readonly defaultOpts: Required<ServiceOptions> = {
        isSingleton: true,
        retain: false,
    };

    getRef(name: string): ServiceDefinition {
        if (!name) {
            throw new Error('Service name is required to resolve it');
        }
        if (typeof name !== 'string') {
            throw new Error('Service name must be a string');
        }

        name = name.trim();
        let svcObj = this.services.get(name);

        if (!svcObj && !name.endsWith('Service')) {
            svcObj = this.services.get(`${name}Service`);
        }

        if (!svcObj) {
            throw new Error(`'${name}' is not a known service`);
        }

        return svcObj;
    }

    resolve(name: string, path: string[] = [], onlySingleton?: boolean, scope?: Record<string, any>): any {
        const svcObj = this.getRef(name);

        if (svcObj.isSingleton && svcObj.instance) {
            return svcObj.instance;
        }

        if (onlySingleton && !svcObj.isSingleton) {
            throw new Error(`"${name}" is not a singleton service. Source: ${path[path.length - 1]}`);
        }

        let instance: any = scope?.[name] || null;

        if (instance) {
            return instance;
        }

        if (svcObj.dependency && svcObj.dependency.length > 0) {
            const dependencies = svcObj.dependency.map((depName) => {
                const newPath = [...path, depName];

                if (path.includes(depName)) {
                    throw new Error(`Circular dependency not supported. Error resolving: ${newPath.join('->')}`);
                }

                return this.resolve(depName, newPath, svcObj.isSingleton, scope);
            });

            instance = new svcObj.type(...dependencies);
        } else {
            instance = new svcObj.type();
        }

        if (svcObj.isSingleton) {
            svcObj.instance = instance;
        } else if (scope) {
            scope[name] = instance;
        }

        return instance;
    }

    injectable<T>(type: ServiceConstructor<T>, serviceName: string, defaultName: string, opts?: ServiceOptions): ServiceConstructor<T> {
        const deps = Array.isArray(type.dependencies) ? (type.dependencies as string[]) : undefined;
        this.addService(serviceName, type, defaultName, deps, opts);
        return type;
    }

    inject(instance: any, dependencies: string[], scope?: any): void {
        if (!import.meta.env.PROD) {
            const uniqueDepsCount = new Set(dependencies).size;
            if (dependencies.length > uniqueDepsCount) {
                throw new Error(`Repeated dependency is not allowed: ${JSON.stringify(dependencies)}`);
            }
        }

        dependencies.forEach((dependency) => {
            const svcObj = this.getRef(dependency);
            instance[svcObj.defaultName] = this.resolve(dependency, undefined, undefined, scope);
        });
    }

    clearInstances(): void {
        this.services.forEach((svc) => {
            delete svc.instance;
        });
    }

    addService(
        name: string,
        type: ServiceConstructor,
        defaultName: string,
        dependency?: string[] | undefined,
        opts?: ServiceOptions,
    ): void {
        if (!name) {
            throw new Error('Service name is required');
        }
        if (typeof name !== 'string') {
            throw new Error('Service name must be a string');
        }

        if (!dependency) {
            dependency = Array.isArray(type.dependencies) ? (type.dependencies as string[]) : undefined;
        }
        if (dependency) {
            if (!Array.isArray(dependency)) {
                throw new Error('Dependencies must be an array with the name of services');
            }
            if (dependency.length === 0) {
                dependency = undefined;
            }
        }

        name = name.trim();
        const options = { ...this.defaultOpts, ...opts };

        const hasOldInstance = this.services.get(name)?.instance;

        this.services.set(name, {
            isSingleton: options.isSingleton,
            retain: options.retain,
            type,
            instance: null,
            dependency,
            name,
            defaultName,
        });

        if (hasOldInstance) {
            this.services.forEach((svc) => {
                if (svc.instance && !svc.retain) {
                    delete svc.instance;
                }
            });
        }
    }
}

const injectorInstance = new Injector();

export function injectable<T>(
    service: ServiceConstructor<T>,
    serviceName: ServiceTypes,
    defaultName: string,
    opts?: ServiceOptions,
): ServiceConstructor<T> {
    return injectorInstance.injectable(service, serviceName, defaultName, opts);
}

export function inject<T extends ServiceTypes[]>(...dependencies: [...T]): ResolvedServices<T>;
export function inject<T extends ServiceTypes[]>(instance: object, ...dependencies: [...T]): ResolvedServices<T>;
export function inject(...dependencies: string[]): Partial<ServiceReference>;
export function inject(instance: object, ...dependencies: string[]): Partial<ServiceReference>;
export function inject(instanceOrDep: any, ...dependencies: string[]): any {
    if (typeof instanceOrDep === 'string') {
        dependencies.unshift(instanceOrDep);
        const instance: any = {};
        injectorInstance.inject(instance, dependencies);
        return instance;
    }

    if (Array.isArray(instanceOrDep)) {
        const instance: any = {};
        injectorInstance.inject(instance, instanceOrDep);
        return instance;
    }

    if (!instanceOrDep) {
        const instance: any = {};
        injectorInstance.inject(instance, dependencies);
        return instance;
    }

    injectorInstance.inject(instanceOrDep, dependencies);
    return instanceOrDep;
}

export function resolveService<T extends ServiceTypes[]>(...dependencies: T): ResolvedServices<T> {
    const instance = {} as ResolvedServices<T>;
    injectorInstance.inject(instance, dependencies as unknown as string[]);
    return instance;
}

export function resolveScopedService<T extends ServiceTypes[]>(...dependencies: T): ResolvedServices<T> {
    const instance = {} as ResolvedServices<T>;
    injectorInstance.inject(instance, dependencies as unknown as string[], {});
    return instance;
}

export function clearInstances(): void {
    injectorInstance.clearInstances();
}

export function useService<T extends ServiceTypes[]>(...services: T): ResolvedServices<T> {
    return resolveService(...services);
}

export const injector = injectorInstance;

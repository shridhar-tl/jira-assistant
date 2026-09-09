/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

interface ImportMetaEnv {
    readonly VITE_BUILD_MODE: string;
    readonly VITE_BUILD_DATE: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

declare module '*.svg?react' {
    import * as React from 'react';
    const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
    export default ReactComponent;
}

declare module '*.css' {
    const content: { [className: string]: string };
    export default content;
}

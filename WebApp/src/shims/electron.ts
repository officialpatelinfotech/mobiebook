// Browser build shim for Electron imports.
// Some legacy code paths reference 'electron' but the WebApp runs in a normal browser.

export const ipcRenderer: any = null;
export const remote: any = null;
export const shell: any = null;
export const app: any = null;

const electronShim: any = {};
export default electronShim;

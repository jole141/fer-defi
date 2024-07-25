/// <reference types="vite/client" />

declare module '@metamask/jazzicon' {
  export default function Jazzicon(size: number, seed: number): HTMLElement;
}

interface Window {
  ethereum: {
    request: import('ethers').Eip1193Provider;
  };
}

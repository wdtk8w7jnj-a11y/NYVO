// Adresses IPv4 du réseau local, pour essayer NYVO depuis un smartphone.
// L'énumération des interfaces peut échouer dans certains environnements
// (uv_interface_addresses) : elle reste alors facultative.
import { networkInterfaces } from 'node:os';

export function localAddresses(list = networkInterfaces) {
  try {
    return Object.values(list())
      .flat()
      .filter((i) => i && i.family === 'IPv4' && !i.internal)
      .map((i) => i.address);
  } catch {
    return null;
  }
}
